import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, requireContributor } from "@/lib/authorization"
import { ContributionStatus, ContributionType } from "@prisma/client"
import { z } from "zod"

// Validation schema for creating a contribution
const contributionSchema = z.object({
  songId: z.string().optional(),
  type: z.nativeEnum(ContributionType),
  data: z.record(z.any()), // JSON data for the contribution
  notes: z.string().optional(),
})

/**
 * POST /api/admin/contributions
 * Create a new contribution
 * Requires: CONTRIBUTOR or ADMIN role
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json()

      // Validate request body
      const validation = contributionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.issues },
          { status: 400 }
        )
      }

      const { songId, type, data, notes } = validation.data

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
          data,
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
