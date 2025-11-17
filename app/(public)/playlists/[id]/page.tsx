import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music, Settings } from "lucide-react";
import { RemoveFromPlaylistButton } from "@/components/playlists/remove-from-playlist-button";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

async function getPlaylist(id: string, userId: string) {
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!playlist) {
    return null;
  }

  // Check if user has access to this playlist
  if (playlist.userId !== userId && !playlist.isPublic) {
    return null;
  }

  return playlist;
}

export async function generateMetadata({ params }: PlaylistPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return {
      title: "Playlist - Chant d'Espérance",
    };
  }

  const playlist = await getPlaylist(id, user.id);

  if (!playlist) {
    return {
      title: "Playlist Not Found",
    };
  }

  return {
    title: `${playlist.name} - My Playlists - Chant d'Espérance`,
    description: playlist.description || `View songs in ${playlist.name}`,
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/playlists/" + id);
  }

  const playlist = await getPlaylist(id, user.id);

  if (!playlist) {
    notFound();
  }

  const isOwner = playlist.userId === user.id;

  return (
    <div className="container py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/playlists">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Playlists
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-gray-600 mb-4">{playlist.description}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
                </Badge>
                {playlist.isPublic && (
                  <Badge variant="outline">Public</Badge>
                )}
                {!isOwner && (
                  <Badge variant="outline">
                    By {playlist.user.name || playlist.user.email}
                  </Badge>
                )}
              </div>
            </div>
            {isOwner && (
              <Link href={`/playlists/${playlist.id}/edit`}>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Songs List */}
        <div className="space-y-3">
          {playlist.songs.length === 0 ? (
            <Card className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No songs in this playlist yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Browse hymns and add them to this playlist.
              </p>
              <Link href="/">
                <Button className="mt-4">
                  <Music className="h-4 w-4 mr-2" />
                  Browse Hymns
                </Button>
              </Link>
            </Card>
          ) : (
            playlist.songs.map((playlistSong, index) => (
              <Card key={playlistSong.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="text-gray-400 font-semibold text-lg flex-shrink-0 w-8">
                      {index + 1}.
                    </div>
                    <Link
                      href={`/songs/${playlistSong.song.id}`}
                      className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-start gap-4">
                        <Badge variant="secondary" className="text-lg px-3 py-1 flex-shrink-0">
                          #{playlistSong.song.songNumber}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold line-clamp-1">
                              {playlistSong.song.title}
                            </h3>
                            {playlistSong.song.language && (
                              <Badge variant="outline" className="flex-shrink-0">
                                {playlistSong.song.language === "FRANCAIS"
                                  ? "FR"
                                  : playlistSong.song.language === "KREYOL"
                                  ? "KR"
                                  : "Bilingual"}
                              </Badge>
                            )}
                          </div>
                          {playlistSong.song.titleKreyol &&
                            playlistSong.song.titleKreyol !== playlistSong.song.title && (
                              <p className="text-gray-600 line-clamp-1 mb-2">
                                {playlistSong.song.titleKreyol}
                              </p>
                            )}
                          {(playlistSong.song.author || playlistSong.song.composer) && (
                            <p className="text-sm text-gray-500 mb-1">
                              {playlistSong.song.author && `By ${playlistSong.song.author}`}
                              {playlistSong.song.author && playlistSong.song.composer && " • "}
                              {playlistSong.song.composer && `Music by ${playlistSong.song.composer}`}
                            </p>
                          )}
                          {(playlistSong.song.firstLine || playlistSong.song.firstLineKreyol) && (
                            <p className="text-sm text-gray-500 line-clamp-1 italic">
                              {playlistSong.song.firstLine || playlistSong.song.firstLineKreyol}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                  {isOwner && (
                    <RemoveFromPlaylistButton
                      playlistId={playlist.id}
                      songId={playlistSong.song.id}
                      songTitle={playlistSong.song.title || playlistSong.song.titleKreyol || "Untitled"}
                    />
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
