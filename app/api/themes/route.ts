import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a theme
const createThemeSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  nameKreyol: z.string().optional(),
  category: z.enum(["OCCASION", "SEASON", "TOPIC", "MOOD", "LITURGICAL", "BIBLICAL"]),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

// GET /api/themes - List all themes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const themes = await prisma.theme.findMany({
      where,
      include: {
        _count: {
          select: {
            songs: true,
          },
        },
      },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
      ],
    })

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Error fetching themes:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch themes",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST /api/themes - Create new theme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = createThemeSchema.parse(body)

    // Create theme
    const theme = await prisma.theme.create({
      data: {
        name: validatedData.name,
        nameKreyol: validatedData.nameKreyol || undefined,
        category: validatedData.category,
        description: validatedData.description || undefined,
        sortOrder: validatedData.sortOrder,
        isActive: validatedData.isActive,
      },
    })

    return NextResponse.json(
      {
        message: "Theme created successfully",
        theme,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating theme:", error)

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
          error: "A theme with this name already exists",
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create theme",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
