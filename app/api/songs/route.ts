import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { songFormSchema } from "@/lib/validations/song"
import { requireContributor, getCurrentUser } from "@/lib/authorization"
import { z } from "zod"
import { createSongWithRelations, SongServiceError } from "@/lib/services/song-service"

export async function POST(request: NextRequest) {
  // Require authentication - only CONTRIBUTOR or ADMIN can create songs
  const user = await requireContributor().catch(() => null)
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: You must be logged in as a contributor or admin to create songs" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = songFormSchema.parse(body)
    const song = await createSongWithRelations(validatedData)

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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Max 100 per page
    const status = searchParams.get("status")
    const sectionId = searchParams.get("sectionId")
    const collectionId = searchParams.get("collectionId")
    const language = searchParams.get("language")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "songNumber"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const user = await getCurrentUser()
    const isPrivileged = !!user && (user.role === "ADMIN" || user.role === "CONTRIBUTOR")

    const skip = (page - 1) * limit

    const where: any = {}

    // Apply filters
    if (status && isPrivileged) {
      where.status = status
    }
    if (!isPrivileged) {
      where.status = "PUBLISHED"
    }

    if (sectionId) {
      where.sectionId = sectionId
    }

    if (collectionId) {
      where.collectionId = collectionId
    }

    if (language) {
      where.language = language
    }

    // Apply search across multiple fields
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { titleKreyol: { contains: search, mode: "insensitive" } },
        { firstLine: { contains: search, mode: "insensitive" } },
        { firstLineKreyol: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { composer: { contains: search, mode: "insensitive" } },
      ]
    }

    // Determine sort order
    const orderBy: any = []
    if (sortBy === "songNumber") {
      orderBy.push({ sectionId: "asc" })
      orderBy.push({ songNumber: sortOrder })
    } else if (sortBy === "title") {
      orderBy.push({ title: sortOrder })
    } else if (sortBy === "createdAt") {
      orderBy.push({ createdAt: sortOrder })
    } else if (sortBy === "viewCount") {
      orderBy.push({ viewCount: sortOrder })
    } else {
      orderBy.push({ sectionId: "asc" })
      orderBy.push({ songNumber: "asc" })
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
          _count: {
            select: {
              verses: true,
              themes: true,
              favorites: true,
            },
          },
        },
        orderBy,
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
      {
        error: "Failed to fetch songs",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
