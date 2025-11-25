import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authorization"
import { z } from "zod"

// Validation schema for updating a collection
const updateCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").optional(),
  nameKreyol: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Validate the request body
    const validatedData = updateCollectionSchema.parse(body)

    const existing = await prisma.collection.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.nameKreyol !== undefined && { nameKreyol: validatedData.nameKreyol }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
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

    return NextResponse.json({
      message: "Collection updated successfully",
      collection,
    })
  } catch (error) {
    console.error("Error updating collection:", error)

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

    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    const existing = await prisma.collection.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    await prisma.collection.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Collection deleted successfully" })
  } catch (error) {
    console.error("Error deleting collection:", error)
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    )
  }
}
