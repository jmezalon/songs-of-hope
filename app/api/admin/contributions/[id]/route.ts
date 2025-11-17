import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, requireAdmin } from "@/lib/authorization"
import { ContributionStatus, ContributionType, SongStatus } from "@prisma/client"
import { z } from "zod"

// Validation schema for updating a contribution
const updateContributionSchema = z.object({
  status: z.nativeEnum(ContributionStatus).optional(),
  reviewNotes: z.string().optional(),
})

/**
 * GET /api/admin/contributions/[id]
 * Get a single contribution by ID
 * Requires: Authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params
      const contribution = await prisma.contribution.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          song: {
            select: {
              id: true,
              title: true,
              titleKreyol: true,
              songNumber: true,
              status: true,
            },
          },
        },
      })

      if (!contribution) {
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 }
        )
      }

      // Non-admin users can only view their own contributions
      if (user.role !== "ADMIN" && contribution.userId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        )
      }

      return NextResponse.json(contribution)
    } catch (error) {
      console.error("Error fetching contribution:", error)
      return NextResponse.json(
        { error: "Failed to fetch contribution" },
        { status: 500 }
      )
    }
  })
}

/**
 * PUT /api/admin/contributions/[id]
 * Update contribution status (approve/reject/request revision)
 * Requires: ADMIN role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    // Only admins can update contribution status
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can review contributions" },
        { status: 403 }
      )
    }

    try {
      const { id } = await params
      const body = await request.json()

      // Validate request body
      const validation = updateContributionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.issues },
          { status: 400 }
        )
      }

      const { status, reviewNotes } = validation.data

      // Fetch the contribution
      const contribution = await prisma.contribution.findUnique({
        where: { id },
        include: {
          song: true,
        },
      })

      if (!contribution) {
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 }
        )
      }

      // If approving, apply the contribution
      if (status === ContributionStatus.APPROVED) {
        await handleApproval(contribution)
      }

      // Update the contribution
      const updatedContribution = await prisma.contribution.update({
        where: { id },
        data: {
          status: status || contribution.status,
          reviewNotes,
          reviewedBy: user.id,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          song: {
            select: {
              id: true,
              title: true,
              titleKreyol: true,
              songNumber: true,
              status: true,
            },
          },
        },
      })

      return NextResponse.json(updatedContribution)
    } catch (error) {
      console.error("Error updating contribution:", error)
      return NextResponse.json(
        { error: "Failed to update contribution" },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/admin/contributions/[id]
 * Delete a contribution
 * Requires: ADMIN role or own contribution
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params
      // Fetch the contribution
      const contribution = await prisma.contribution.findUnique({
        where: { id },
      })

      if (!contribution) {
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 }
        )
      }

      // Only admin or the contributor can delete
      if (user.role !== "ADMIN" && contribution.userId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        )
      }

      // Delete the contribution
      await prisma.contribution.delete({
        where: { id },
      })

      return NextResponse.json({ message: "Contribution deleted successfully" })
    } catch (error) {
      console.error("Error deleting contribution:", error)
      return NextResponse.json(
        { error: "Failed to delete contribution" },
        { status: 500 }
      )
    }
  })
}

/**
 * Helper function to handle contribution approval
 */
async function handleApproval(contribution: any) {
  const contributionData = contribution.data as any

  switch (contribution.type) {
    case ContributionType.NEW_SONG:
      // Create a new song from the contribution data
      await prisma.song.create({
        data: {
          ...contributionData,
          status: SongStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      })
      break

    case ContributionType.CORRECTION:
      // Update existing song with corrections
      if (contribution.songId) {
        await prisma.song.update({
          where: { id: contribution.songId },
          data: contributionData,
        })
      }
      break

    case ContributionType.TRANSLATION:
      // Update song with translation data
      if (contribution.songId) {
        await prisma.song.update({
          where: { id: contribution.songId },
          data: contributionData,
        })
      }
      break

    case ContributionType.METADATA:
      // Update song metadata
      if (contribution.songId) {
        await prisma.song.update({
          where: { id: contribution.songId },
          data: contributionData,
        })
      }
      break

    case ContributionType.MEDIA:
      // Handle media contribution
      if (contribution.songId && contributionData.media) {
        await prisma.media.create({
          data: {
            ...contributionData.media,
            songId: contribution.songId,
            uploadedBy: contribution.userId,
          },
        })
      }
      break

    default:
      throw new Error(`Unknown contribution type: ${contribution.type}`)
  }
}
