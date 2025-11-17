import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { List, Music, Plus } from "lucide-react";
import { CreatePlaylistButton } from "@/components/playlists/create-playlist-button";
import { DeletePlaylistButton } from "@/components/playlists/delete-playlist-button";

export const metadata: Metadata = {
  title: "My Playlists - Chant d'Espérance",
  description: "View and manage your playlists",
};

async function getPlaylists(userId: string) {
  return prisma.playlist.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          songs: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export default async function PlaylistsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/playlists");
  }

  const playlists = await getPlaylists(user.id);

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <List className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">My Playlists</h1>
              <p className="text-gray-600 mt-1">
                {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
              </p>
            </div>
          </div>
          <CreatePlaylistButton />
        </div>

        {playlists.length === 0 ? (
          <Card className="p-12 text-center">
            <List className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No playlists yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first playlist to organize your favorite hymns
            </p>
            <CreatePlaylistButton />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <Link
                    href={`/playlists/${playlist.id}`}
                    className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-xl font-semibold line-clamp-2 mb-2">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-gray-600 line-clamp-2 text-sm mb-3">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {playlist._count.songs} {playlist._count.songs === 1 ? "song" : "songs"}
                      </Badge>
                      {playlist.isPublic && (
                        <Badge variant="outline">Public</Badge>
                      )}
                    </div>
                  </Link>
                  <DeletePlaylistButton
                    playlistId={playlist.id}
                    playlistName={playlist.name}
                  />
                </div>
                <Link href={`/playlists/${playlist.id}`}>
                  <Button variant="outline" className="w-full">
                    <Music className="h-4 w-4 mr-2" />
                    View Playlist
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
