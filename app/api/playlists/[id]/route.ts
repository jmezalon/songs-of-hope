import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authorization";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/playlists/[id] - Get a specific playlist
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
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
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Check if user has access to this playlist
    if (playlist.userId !== user.id && !playlist.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ playlist });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}

// PATCH /api/playlists/[id] - Update a playlist
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, isPublic } = body;

    // Check if playlist exists and belongs to user
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    if (existingPlaylist.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update playlist
    const playlist = await prisma.playlist.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ playlist });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating playlist:", error);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[id] - Delete a playlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    // Check if playlist exists and belongs to user
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    if (existingPlaylist.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete playlist (cascade will delete playlist songs)
    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
