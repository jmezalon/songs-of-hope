import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { songFormSchema } from "@/lib/validations/song"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = songFormSchema.parse(body)

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
          { error: "Popular Songs collection not found. Please create it first." },
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

    // Create song with all related data in a transaction
    const song = await prisma.$transaction(async (tx) => {
      // Create the song
      const createdSong = await tx.song.create({
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
          publishedAt: validatedData.status === "PUBLISHED" ? new Date() : null,
        },
      })

      // Create verses and lines
      if (validatedData.verses && validatedData.verses.length > 0) {
        for (const verse of validatedData.verses) {
          const createdVerse = await tx.verse.create({
            data: {
              songId: createdSong.id,
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

      // Create theme relationships
      if (validatedData.themeIds && validatedData.themeIds.length > 0) {
        await tx.songTheme.createMany({
          data: validatedData.themeIds.map((themeId) => ({
            songId: createdSong.id,
            themeId,
          })),
        })
      }

      // Create biblical references and relationships
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
              songId: createdSong.id,
              biblicalReferenceId: biblicalRef.id,
            },
          })
        }
      }

      // Create media records
      if (validatedData.media && validatedData.media.length > 0) {
        await tx.media.createMany({
          data: validatedData.media.map((mediaItem, index) => ({
            songId: createdSong.id,
            type: mediaItem.type,
            url: mediaItem.url,
            title: mediaItem.title || undefined,
            sortOrder: index,
            isPublic: true,
          })),
        })
      }

      // Return the created song with all relations
      return await tx.song.findUnique({
        where: { id: createdSong.id },
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

    return NextResponse.json(
      {
        message: "Song created successfully",
        song,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating song:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")

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

    // Return detailed error message in development
    return NextResponse.json(
      {
        error: "Failed to create song",
        message: error instanceof Error ? error.message : String(error),
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const sectionId = searchParams.get("sectionId")
    const language = searchParams.get("language")

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (sectionId) {
      where.sectionId = sectionId
    }

    if (language) {
      where.language = language
    }

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        include: {
          section: {
            select: {
              name: true,
              nameKreyol: true,
            },
          },
          collection: {
            select: {
              name: true,
              nameKreyol: true,
            },
          },
        },
        orderBy: [
          { sectionId: "asc" },
          { songNumber: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.song.count({ where }),
    ])

    return NextResponse.json({
      songs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching songs:", error)
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    )
  }
}
