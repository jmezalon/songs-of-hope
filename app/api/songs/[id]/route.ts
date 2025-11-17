import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { songFormSchema } from "@/lib/validations/song"
import { requireContributor, getCurrentUser } from "@/lib/authorization"
import { z } from "zod"
import { updateSongWithRelations, SongServiceError } from "@/lib/services/song-service"

// GET /api/songs/[id] - Get single song with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            nameKreyol: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            nameKreyol: true,
          },
        },
        verses: {
          include: {
            lines: {
              orderBy: { lineNumber: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        themes: {
          include: {
            theme: {
              select: {
                id: true,
                name: true,
                nameKreyol: true,
                category: true,
              },
            },
          },
        },
        biblicalRefs: {
          include: {
            biblicalReference: {
              select: {
                id: true,
                book: true,
                chapter: true,
                verseStart: true,
                verseEnd: true,
              },
            },
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            type: true,
            title: true,
            url: true,
            thumbnailUrl: true,
            duration: true,
            sortOrder: true,
          },
        },
        companionSong: {
          select: {
            id: true,
            title: true,
            titleKreyol: true,
            songNumber: true,
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    })

    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    const user = await getCurrentUser()
    const canView =
      song.status === "PUBLISHED" ||
      (user && (user.role === "ADMIN" || user.role === "CONTRIBUTOR"))

    if (!canView) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    // Increment view count asynchronously (don't await)
    prisma.song.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch((error) => {
      console.error("Failed to increment view count:", error)
    })

    return NextResponse.json({ song })
  } catch (error) {
    console.error("Error fetching song:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch song",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// PUT /api/songs/[id] - Update song
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication - only CONTRIBUTOR or ADMIN can update songs
  const user = await requireContributor().catch(() => null)
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: You must be logged in as a contributor or admin to update songs" },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    const validatedData = songFormSchema.parse(body)
    const song = await updateSongWithRelations(id, validatedData)

    return NextResponse.json({
      message: "Song updated successfully",
      song,
    })
  } catch (error) {
    console.error("Error updating song:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    if (error instanceof SongServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "A song with this section, number, and language already exists",
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to update song",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// DELETE /api/songs/[id] - Delete song
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication - only CONTRIBUTOR or ADMIN can delete songs
  const user = await requireContributor().catch(() => null)
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: You must be logged in as a contributor or admin to delete songs" },
      { status: 401 }
    )
  }

  try {
    const { id } = await params

    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id },
      select: { id: true, title: true },
    })

    if (!existingSong) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    // Delete song (cascade will handle related records)
    await prisma.song.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Song deleted successfully",
      deletedSong: existingSong,
    })
  } catch (error) {
    console.error("Error deleting song:", error)
    return NextResponse.json(
      {
        error: "Failed to delete song",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
