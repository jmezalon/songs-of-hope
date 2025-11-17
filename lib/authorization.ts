import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"

/**
 * Get the current user session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  if (!user.isActive) {
    throw new Error("Account is deactivated")
  }
  return user
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Require specific role(s) - throws error if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!hasRole(user.role, allowedRoles)) {
    throw new Error("Forbidden: Insufficient permissions")
  }
  return user
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole([UserRole.ADMIN])
}

/**
 * Require admin or contributor role
 */
export async function requireContributor() {
  return requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR])
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}

/**
 * Check if user is contributor or higher
 */
export function isContributorOrHigher(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.CONTRIBUTOR
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper to return forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Wrapper for API routes that require authentication
 */
export async function withAuth(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<Response>
) {
  try {
    const user = await requireAuth()
    return handler(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Account is deactivated") {
        return unauthorizedResponse(error.message)
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Wrapper for API routes that require specific roles
 */
export async function withRole(
  allowedRoles: UserRole[],
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<Response>
) {
  try {
    const user = await requireRole(allowedRoles)
    return handler(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Account is deactivated") {
        return unauthorizedResponse(error.message)
      }
      if (error.message.startsWith("Forbidden")) {
        return forbiddenResponse(error.message)
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
