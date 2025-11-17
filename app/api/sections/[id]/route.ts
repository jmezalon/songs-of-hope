import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authorization"

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
