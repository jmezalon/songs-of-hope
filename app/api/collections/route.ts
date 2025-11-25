import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAdmin } from "@/lib/authorization"

// Validation schema for creating a collection
const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  nameKreyol: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

// GET /api/collections - List all collections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const collections = await prisma.collection.findMany({
      where,
      include: {
        _count: {
          select: {
            sections: true,
            songs: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    })

    return NextResponse.json({ collections })
  } catch (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch collections",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST /api/collections - Create new collection (admin only)
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
    const validatedData = createCollectionSchema.parse(body)

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name: validatedData.name,
        nameKreyol: validatedData.nameKreyol || undefined,
        description: validatedData.description || undefined,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive,
      },
      include: {
        _count: {
          select: {
            sections: true,
            songs: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Collection created successfully",
        collection,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating collection:", error)

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
          error: "A collection with this name already exists",
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create collection",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
