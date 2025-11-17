import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { songFormSchema } from "@/lib/validations/song"
import { z } from "zod"

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
  try {
    const { id } = await params
    const body = await request.json()

    // Validate the request body
    const validatedData = songFormSchema.parse(body)

    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id },
    })

    if (!existingSong) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    // Get collectionId from section if it's a hymnal song
    let collectionId: string

    if (validatedData.songType === "hymnal" && validatedData.sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: validatedData.sectionId },
        select: { collectionId: true },
      })

      if (!section) {
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 }
        )
      }

      collectionId = section.collectionId
    } else {
      // For popular songs, get the default "Popular Songs" collection
      const popularCollection = await prisma.collection.findFirst({
        where: {
          name: "Popular Songs",
          isActive: true,
        },
      })

      if (!popularCollection) {
        return NextResponse.json(
          { error: "Popular Songs collection not found" },
          { status: 404 }
        )
      }

      collectionId = popularCollection.id
    }

    // Extract first line from verses if not provided
    const firstLine = validatedData.firstLine ||
      (validatedData.verses?.[0]?.lines?.[0]?.text || undefined)
    const firstLineKreyol = validatedData.firstLineKreyol ||
      (validatedData.verses?.[0]?.lines?.[0]?.textKreyol || undefined)

    // Update song with all related data in a transaction
    const song = await prisma.$transaction(async (tx) => {
      // Update the song
      const updatedSong = await tx.song.update({
        where: { id },
        data: {
          // Basic Information
          title: validatedData.title,
          titleKreyol: validatedData.titleKreyol || undefined,
          subtitle: validatedData.subtitle || undefined,
          subtitleKreyol: validatedData.subtitleKreyol || undefined,

          // Collection & Section
          collectionId,
          sectionId: validatedData.sectionId || undefined,
          songNumber: validatedData.songNumber || undefined,
          language: validatedData.language || "BILINGUAL",
          companionSongId: validatedData.companionSongId || undefined,

          // Musical Information
          tune: validatedData.tune || undefined,
          meter: validatedData.meter || undefined,
          musicalKey: validatedData.musicalKey || undefined,
          timeSignature: validatedData.timeSignature || undefined,
          tempo: validatedData.tempo || undefined,

          // Attribution
          author: validatedData.author || undefined,
          authorKreyol: validatedData.authorKreyol || undefined,
          composer: validatedData.composer || undefined,
          translator: validatedData.translator || undefined,
          arranger: validatedData.arranger || undefined,
          yearWritten: validatedData.yearWritten || undefined,
          copyrightStatus: validatedData.copyrightStatus,
          copyrightInfo: validatedData.copyrightInfo || undefined,

          // Metadata
          firstLine: firstLine || undefined,
          firstLineKreyol: firstLineKreyol || undefined,
          summary: validatedData.summary || undefined,
          notes: validatedData.notes || undefined,

          // Status
          status: validatedData.status,
          publishedAt: validatedData.status === "PUBLISHED" && !existingSong.publishedAt
            ? new Date()
            : existingSong.publishedAt,
        },
      })

      // Delete existing verses and lines (cascade will handle lines)
      await tx.verse.deleteMany({
        where: { songId: id },
      })

      // Create new verses and lines
      if (validatedData.verses && validatedData.verses.length > 0) {
        for (const verse of validatedData.verses) {
          const createdVerse = await tx.verse.create({
            data: {
              songId: id,
              type: verse.type,
              verseNumber: verse.verseNumber || undefined,
              label: verse.label || undefined,
              labelKreyol: verse.labelKreyol || undefined,
              sortOrder: verse.sortOrder,
              isRepeated: verse.isRepeated,
            },
          })

          // Create lines for this verse
          if (verse.lines && verse.lines.length > 0) {
            await tx.line.createMany({
              data: verse.lines.map((line) => ({
                verseId: createdVerse.id,
                text: line.text,
                textKreyol: line.textKreyol || undefined,
                lineNumber: line.lineNumber,
                isIndented: line.isIndented,
                indent: line.indent,
              })),
            })
          }
        }
      }

      // Delete and recreate theme relationships
      await tx.songTheme.deleteMany({
        where: { songId: id },
      })

      if (validatedData.themeIds && validatedData.themeIds.length > 0) {
        // Validate that all theme IDs exist
        const existingThemes = await tx.theme.findMany({
          where: {
            id: {
              in: validatedData.themeIds,
            },
          },
          select: { id: true },
        })

        const existingThemeIds = existingThemes.map((t) => t.id)
        const invalidThemeIds = validatedData.themeIds.filter(
          (id) => !existingThemeIds.includes(id)
        )

        if (invalidThemeIds.length > 0) {
          throw new Error(
            `Invalid theme IDs: ${invalidThemeIds.join(", ")}. Please select valid themes.`
          )
        }

        await tx.songTheme.createMany({
          data: validatedData.themeIds.map((themeId) => ({
            songId: id,
            themeId,
          })),
        })
      }

      // Delete and recreate biblical reference relationships
      await tx.songBiblicalReference.deleteMany({
        where: { songId: id },
      })

      if (validatedData.biblicalReferences && validatedData.biblicalReferences.length > 0) {
        for (const ref of validatedData.biblicalReferences) {
          // Try to find existing biblical reference or create new one
          const biblicalRef = await tx.biblicalReference.upsert({
            where: {
              id: ref.id,
            },
            update: {},
            create: {
              book: ref.book,
              chapter: ref.chapter,
              verseStart: ref.verseStart,
              verseEnd: ref.verseEnd,
            },
          })

          // Create the relationship
          await tx.songBiblicalReference.create({
            data: {
              songId: id,
              biblicalReferenceId: biblicalRef.id,
            },
          })
        }
      }

      // Delete and recreate media records
      await tx.media.deleteMany({
        where: { songId: id },
      })

      if (validatedData.media && validatedData.media.length > 0) {
        await tx.media.createMany({
          data: validatedData.media.map((mediaItem, index) => ({
            songId: id,
            type: mediaItem.type,
            url: mediaItem.url,
            title: mediaItem.title || undefined,
            sortOrder: index,
            isPublic: true,
          })),
        })
      }

      // Return the updated song with all relations
      return await tx.song.findUnique({
        where: { id },
        include: {
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
              theme: true,
            },
          },
          biblicalRefs: {
            include: {
              biblicalReference: true,
            },
          },
          media: {
            orderBy: { sortOrder: "asc" },
          },
        },
      })
    })

    return NextResponse.json({
      message: "Song updated successfully",
      song,
    })
  } catch (error) {
    console.error("Error updating song:", error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint violations
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
