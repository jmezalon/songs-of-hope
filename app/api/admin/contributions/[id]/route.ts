import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/authorization"
import { ContributionStatus, ContributionType, type Contribution, type Prisma } from "@prisma/client"
import { songFormSchema, type SongFormValues } from "@/lib/validations/song"
import { createSongWithRelations, SongServiceError } from "@/lib/services/song-service"
import { z } from "zod"

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
 * PATCH /api/admin/contributions/[id]
 * Allow contributors to update their own submissions when revisions are requested
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { data, notes } = body as { data?: unknown; notes?: string }

      if (data === undefined || data === null || typeof data !== "object" || Array.isArray(data)) {
        return NextResponse.json(
          { error: "Invalid contribution data" },
          { status: 400 }
        )
      }

      const contribution = await prisma.contribution.findUnique({
        where: { id },
      })

      if (!contribution) {
        return NextResponse.json(
          { error: "Contribution not found" },
          { status: 404 }
        )
      }

      if (contribution.userId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        )
      }

      if (contribution.status !== ContributionStatus.NEEDS_REVISION) {
        return NextResponse.json(
          { error: "Only contributions needing revision can be edited" },
          { status: 400 }
        )
      }

      let normalizedData: unknown = data
      if (contribution.type === ContributionType.NEW_SONG) {
        normalizedData = songFormSchema.parse(data as SongFormValues)
      }

      const updatedContribution = await prisma.contribution.update({
        where: { id },
        data: {
          data: normalizedData as Prisma.InputJsonValue,
          notes: notes ?? contribution.notes,
          status: ContributionStatus.PENDING,
          reviewNotes: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      })

      return NextResponse.json({ contribution: updatedContribution })
    } catch (error) {
      console.error("Error updating contribution:", error)
      if (error instanceof SongServiceError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        )
      }
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Failed to update contribution" },
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

      const { status, reviewNotes } = body as {
        status?: ContributionStatus
        reviewNotes?: string
      }

      // Basic runtime validation instead of Zod to avoid runtime issues
      if (status && !Object.values(ContributionStatus).includes(status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        )
      }

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

      let approvalResult: { songId?: string } | null = null

      // If approving, apply the contribution
      if (status === ContributionStatus.APPROVED) {
        approvalResult = await handleApproval(contribution)
      }

      // Update the contribution
      const updatedContribution = await prisma.contribution.update({
        where: { id },
        data: {
          status: status || contribution.status,
          reviewNotes,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          // If approval created/linked a song, persist that relationship
          songId: approvalResult?.songId ?? contribution.songId ?? null,
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

      return NextResponse.json({
        contribution: updatedContribution,
        songId: approvalResult?.songId ?? contribution.song?.id ?? null,
      })
    } catch (error) {
      console.error("Error updating contribution:", error)
      if (error instanceof SongServiceError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        )
      }
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
async function handleApproval(
  contribution: Contribution & { song: { id: string } | null }
): Promise<{ songId?: string }> {
      const contributionData = contribution.data as Record<string, unknown>

  switch (contribution.type) {
    case ContributionType.NEW_SONG: {
      const parsedData = songFormSchema.parse(contributionData as SongFormValues)
      const finalData: SongFormValues = {
        ...parsedData,
        status: "PUBLISHED",
      }

      const createdSong = await createSongWithRelations(finalData)
      return { songId: createdSong?.id }
    }

    case ContributionType.CORRECTION:
      // Update existing song with corrections
      if (contribution.songId) {
        await prisma.song.update({
          where: { id: contribution.songId },
          data: contributionData,
        })
      }
      return { songId: contribution.songId ?? undefined }

    case ContributionType.TRANSLATION:
      // Update song with translation data
      if (contribution.songId) {
        await prisma.song.update({
          where: { id: contribution.songId },
          data: contributionData,
        })
      }
      return { songId: contribution.songId ?? undefined }

    case ContributionType.METADATA:
      // Update song metadata
      if (contribution.songId) {
        await prisma.song.update({
          where: { id: contribution.songId },
          data: contributionData,
        })
      }
      return { songId: contribution.songId ?? undefined }

    case ContributionType.MEDIA:
      // Handle media contribution
      if (contribution.songId && contributionData.media) {
        const mediaPayload = contributionData.media as Prisma.MediaUncheckedCreateInput
        await prisma.media.create({
          data: {
            ...mediaPayload,
            songId: contribution.songId,
            uploadedBy: contribution.userId,
          },
        })
      }
      return { songId: contribution.songId ?? undefined }

    default:
      throw new Error(`Unknown contribution type: ${contribution.type}`)
  }
}
