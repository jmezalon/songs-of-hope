import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authorization"
import { z } from "zod"

// Validation schema for updating a section
const updateSectionSchema = z.object({
  collectionId: z.string().optional(),
  name: z.string().min(1, "Section name is required").optional(),
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
    const validatedData = updateSectionSchema.parse(body)

    const existing = await prisma.section.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    // If updating collectionId, verify the collection exists
    if (validatedData.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: validatedData.collectionId },
      })

      if (!collection) {
        return NextResponse.json(
          { error: "Collection not found" },
          { status: 404 }
        )
      }
    }

    const section = await prisma.section.update({
      where: { id },
      data: {
        ...(validatedData.collectionId !== undefined && { collectionId: validatedData.collectionId }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.nameKreyol !== undefined && { nameKreyol: validatedData.nameKreyol }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
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
    })

    return NextResponse.json({
      message: "Section updated successfully",
      section,
    })
  } catch (error) {
    console.error("Error updating section:", error)

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
      { error: "Failed to update section" },
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

    const existing = await prisma.section.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    await prisma.section.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Section deleted successfully" })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    )
  }
}
