import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      where: {
        isActive: true,
      },
      include: {
        collection: {
          select: {
            name: true,
            nameKreyol: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    )
  }
}
