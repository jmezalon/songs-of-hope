import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
