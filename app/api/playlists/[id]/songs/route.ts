import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authorization";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/playlists/[id]/songs - Add a song to a playlist
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: { sortOrder: "desc" },
          take: 1,
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    if (playlist.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Check if song is already in playlist
    const existing = await prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId: id,
          songId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Song already in playlist" },
        { status: 400 }
      );
    }

    // Get next sort order
    const nextSortOrder = playlist.songs[0] ? playlist.songs[0].sortOrder + 1 : 0;

    // Add song to playlist
    const playlistSong = await prisma.playlistSong.create({
      data: {
        playlistId: id,
        songId,
        sortOrder: nextSortOrder,
      },
    });

    // Update playlist updatedAt
    await prisma.playlist.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ playlistSong }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error adding song to playlist:", error);
    return NextResponse.json(
      { error: "Failed to add song to playlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[id]/songs - Remove a song from a playlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    if (playlist.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove song from playlist
    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: {
          playlistId: id,
          songId,
        },
      },
    });

    // Update playlist updatedAt
    await prisma.playlist.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing song from playlist:", error);
    return NextResponse.json(
      { error: "Failed to remove song from playlist" },
      { status: 500 }
    );
  }
}
