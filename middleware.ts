import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Only check authentication for admin routes
  if (path.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // User must be authenticated
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", path)
      return NextResponse.redirect(loginUrl)
    }

    // User must be active
    if (!token.isActive) {
      return NextResponse.redirect(new URL("/login?error=AccountDeactivated", req.url))
    }

    // User must have ADMIN or CONTRIBUTOR role
    if (token.role !== "ADMIN" && token.role !== "CONTRIBUTOR") {
      return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
