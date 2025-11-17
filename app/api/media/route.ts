import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const songId = searchParams.get("songId")

    const where: any = {}

    // Apply filters
    if (type) {
      where.type = type
    }

    if (songId) {
      where.songId = songId
    }

    const media = await prisma.media.findMany({
      where,
      include: {
        song: {
          select: {
            id: true,
            title: true,
            songNumber: true,
          },
        },
        uploader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json({
      media,
      total: media.length,
    })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch media",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
