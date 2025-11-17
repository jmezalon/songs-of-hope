import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if media exists
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      )
    }

    // Delete the media
    await prisma.media.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Media deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json(
      {
        error: "Failed to delete media",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
