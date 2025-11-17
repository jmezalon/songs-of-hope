import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authorization";

// GET /api/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        song: {
          select: {
            id: true,
            songNumber: true,
            title: true,
            titleKreyol: true,
            firstLine: true,
            firstLineKreyol: true,
            language: true,
            author: true,
            composer: true,
            _count: {
              select: {
                favorites: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      favorites: favorites.map((fav) => ({
        id: fav.id,
        createdAt: fav.createdAt,
        song: fav.song,
      })),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a song to favorites
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_songId: {
          userId: user.id,
          songId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Song already in favorites" },
        { status: 400 }
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        songId,
      },
      include: {
        song: {
          select: {
            id: true,
            songNumber: true,
            title: true,
            titleKreyol: true,
          },
        },
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a song from favorites
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Delete favorite
    await prisma.favorite.delete({
      where: {
        userId_songId: {
          userId: user.id,
          songId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
