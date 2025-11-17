import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Music } from "lucide-react";
import { RemoveFavoriteButton } from "@/components/favorites/remove-favorite-button";

export const metadata: Metadata = {
  title: "My Favorites - Chant d'Espérance",
  description: "View your favorite hymns",
};

async function getFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
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
}

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/favorites");
  }

  const favorites = await getFavorites(user.id);

  return (
    <div className="container py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <div>
            <h1 className="text-4xl font-bold">My Favorites</h1>
            <p className="text-gray-600 mt-1">
              {favorites.length} {favorites.length === 1 ? "hymn" : "hymns"}
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">
              Start adding hymns to your favorites to see them here
            </p>
            <Link href="/">
              <Button>
                <Music className="h-4 w-4 mr-2" />
                Browse Hymns
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/songs/${favorite.song.id}`}
                    className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start gap-4">
                      <Badge variant="secondary" className="text-lg px-3 py-1 flex-shrink-0">
                        #{favorite.song.songNumber}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold line-clamp-1">
                            {favorite.song.title}
                          </h3>
                          {favorite.song.language && (
                            <Badge variant="outline" className="flex-shrink-0">
                              {favorite.song.language === "FRANCAIS"
                                ? "FR"
                                : favorite.song.language === "KREYOL"
                                ? "KR"
                                : "Bilingual"}
                            </Badge>
                          )}
                        </div>
                        {favorite.song.titleKreyol &&
                          favorite.song.titleKreyol !== favorite.song.title && (
                            <p className="text-gray-600 line-clamp-1 mb-2">
                              {favorite.song.titleKreyol}
                            </p>
                          )}
                        {(favorite.song.author || favorite.song.composer) && (
                          <p className="text-sm text-gray-500 mb-1">
                            {favorite.song.author && `By ${favorite.song.author}`}
                            {favorite.song.author && favorite.song.composer && " • "}
                            {favorite.song.composer && `Music by ${favorite.song.composer}`}
                          </p>
                        )}
                        {(favorite.song.firstLine || favorite.song.firstLineKreyol) && (
                          <p className="text-sm text-gray-500 line-clamp-1 italic">
                            {favorite.song.firstLine || favorite.song.firstLineKreyol}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <RemoveFavoriteButton
                    songId={favorite.song.id}
                    songTitle={favorite.song.title || favorite.song.titleKreyol || "Untitled"}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
