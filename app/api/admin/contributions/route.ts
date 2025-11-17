import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/authorization"
import { ContributionStatus, ContributionType } from "@prisma/client"
import { songFormSchema, type SongFormValues } from "@/lib/validations/song"
import { z } from "zod"

/**
 * POST /api/admin/contributions
 * Create a new contribution
 * Requires: CONTRIBUTOR or ADMIN role
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json()

      const { songId, type, data, notes } = body as {
        songId?: string
        type?: ContributionType
        data?: unknown
        notes?: string
      }

      // Basic runtime validation instead of Zod to avoid runtime issues
      if (!type || !Object.values(ContributionType).includes(type)) {
        return NextResponse.json(
          { error: "Invalid contribution type" },
          { status: 400 }
        )
      }

      if (data === undefined || data === null || typeof data !== "object" || Array.isArray(data)) {
        return NextResponse.json(
          { error: "Invalid contribution data" },
          { status: 400 }
        )
      }

      let normalizedData: unknown = data
      if (type === ContributionType.NEW_SONG) {
        try {
          normalizedData = songFormSchema.parse(data as SongFormValues)
        } catch (parseError) {
          if (parseError instanceof z.ZodError) {
            return NextResponse.json(
              { error: "Validation failed", details: parseError.issues },
              { status: 400 }
            )
          }
          if (parseError instanceof Error) {
            return NextResponse.json(
              { error: parseError.message },
              { status: 400 }
            )
          }
        }
      }

      // If songId is provided, verify it exists
      if (songId) {
        const song = await prisma.song.findUnique({
          where: { id: songId },
        })
        if (!song) {
          return NextResponse.json(
            { error: "Song not found" },
            { status: 404 }
          )
        }
      }

      // Create the contribution
      const contribution = await prisma.contribution.create({
        data: {
          userId: user.id,
          songId,
          type,
          data: normalizedData as Record<string, unknown>,
          notes,
          status: ContributionStatus.PENDING,
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
            },
          },
        },
      })

      return NextResponse.json(contribution, { status: 201 })
    } catch (error) {
      console.error("Error creating contribution:", error)
      return NextResponse.json(
        { error: "Failed to create contribution" },
        { status: 500 }
      )
    }
  })
}

/**
 * GET /api/admin/contributions
 * List contributions with filtering and pagination
 * Requires: Authentication
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams

      // Pagination
      const page = parseInt(searchParams.get("page") || "1")
      const limit = parseInt(searchParams.get("limit") || "20")
      const skip = (page - 1) * limit

      // Filters
      const status = searchParams.get("status") as ContributionStatus | null
      const type = searchParams.get("type") as ContributionType | null
      const userId = searchParams.get("userId")
      const songId = searchParams.get("songId")

      // Build where clause
      const where: any = {}

      if (status) {
        where.status = status
      }
      if (type) {
        where.type = type
      }
      if (userId) {
        where.userId = userId
      }
      if (songId) {
        where.songId = songId
      }

      // If user is not admin, only show their own contributions
      if (user.role !== "ADMIN") {
        where.userId = user.id
      }

      // Fetch contributions
      const [contributions, total] = await Promise.all([
        prisma.contribution.findMany({
          where,
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
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.contribution.count({ where }),
      ])

      return NextResponse.json({
        contributions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error("Error fetching contributions:", error)
      return NextResponse.json(
        { error: "Failed to fetch contributions" },
        { status: 500 }
      )
    }
  })
}
