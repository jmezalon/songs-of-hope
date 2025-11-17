import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAdmin } from "@/lib/authorization"

// Validation schema for creating a section
const createSectionSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
  name: z.string().min(1, "Section name is required"),
  nameKreyol: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

// GET /api/sections - List all sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collectionId")
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (collectionId) {
      where.collectionId = collectionId
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const sections = await prisma.section.findMany({
      where,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            nameKreyol: true,
          },
        },
        _count: {
          select: {
            songs: true,
          },
        },
      },
      orderBy: [
        { collectionId: "asc" },
        { sortOrder: "asc" },
      ],
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch sections",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST /api/sections - Create new section (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin().catch(() => null)
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate the request body
    const validatedData = createSectionSchema.parse(body)

    // Check if collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: validatedData.collectionId },
    })

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      )
    }

    // Create section
    const section = await prisma.section.create({
      data: {
        collectionId: validatedData.collectionId,
        name: validatedData.name,
        nameKreyol: validatedData.nameKreyol || undefined,
        description: validatedData.description || undefined,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            nameKreyol: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Section created successfully",
        section,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating section:", error)

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
          error: "A section with this name already exists in this collection",
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create section",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
