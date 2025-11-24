import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, TrendingUp, Clock } from "lucide-react";
import { SearchBarWrapper } from "./search-bar-wrapper";

export const dynamic = "force-dynamic";

async function getFeaturedSongs() {
  const [popular, recent] = await Promise.all([
    // Get popular songs
    prisma.song.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { popularityScore: "desc" },
      take: 6,
      select: {
        id: true,
        songNumber: true,
        title: true,
        titleKreyol: true,
        firstLine: true,
        firstLineKreyol: true,
        language: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    }),
    // Get recently added songs
    prisma.song.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        songNumber: true,
        title: true,
        titleKreyol: true,
        firstLine: true,
        firstLineKreyol: true,
        language: true,
        createdAt: true,
      },
    }),
  ]);

  return { popular, recent };
}

async function getCollectionsWithSections() {
  return prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 5,
        select: {
          id: true,
          name: true,
          nameKreyol: true,
          _count: {
            select: {
              songs: true,
            },
          },
        },
      },
      _count: {
        select: {
          songs: true,
        },
      },
    },
  });
}

export default async function HomePage() {
  const [{ popular, recent }, collections] = await Promise.all([
    getFeaturedSongs(),
    getCollectionsWithSections(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Chant d'Espérance
            </h1>
            <p className="text-xl md:text-2xl text-gray-600">
              Songs of Hope - Haitian Hymnal
            </p>
            <p className="text-base md:text-lg text-gray-500">
              Explore hymns in French and Kreyòl · Search · Listen · Sing
            </p>

            {/* Search Bar */}
            <div className="pt-8">
              <Suspense fallback={<SearchFallback />}>
                <SearchBarWrapper />
              </Suspense>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link href="/search">
                <Button variant="outline" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Advanced Search
                </Button>
              </Link>
              <Link href="/sections/all">
                <Button variant="outline" size="lg">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse by Section
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Songs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Popular Hymns</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map((song) => (
              <Link key={song.id} href={`/songs/${song.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        {song.songNumber && (
                          <Badge variant="secondary">#{song.songNumber}</Badge>
                        )}
                        {song.language && (
                          <Badge variant="outline" className={song.songNumber ? "ml-2" : ""}>
                            {song.language === "FRANCAIS" ? "FR" : song.language === "KREYOL" ? "KR" : "Bilingual"}
                          </Badge>
                        )}
                      </div>
                      {song._count.favorites > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>{song._count.favorites}</span>
                          <span>❤️</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {song.title}
                      </h3>
                      {song.titleKreyol && song.titleKreyol !== song.title && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {song.titleKreyol}
                        </p>
                      )}
                    </div>
                    {(song.firstLine || song.firstLineKreyol) && (
                      <p className="text-sm text-gray-500 line-clamp-2 italic">
                        {song.firstLine || song.firstLineKreyol}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Recently Added</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((song) => (
              <Link key={song.id} href={`/songs/${song.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      {song.songNumber && (
                        <Badge variant="secondary">#{song.songNumber}</Badge>
                      )}
                      {song.language && (
                        <Badge variant="outline">
                          {song.language === "FRANCAIS" ? "FR" : song.language === "KREYOL" ? "KR" : "Bilingual"}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {song.title}
                      </h3>
                      {song.titleKreyol && song.titleKreyol !== song.title && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {song.titleKreyol}
                        </p>
                      )}
                    </div>
                    {(song.firstLine || song.firstLineKreyol) && (
                      <p className="text-sm text-gray-500 line-clamp-2 italic">
                        {song.firstLine || song.firstLineKreyol}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Collection/Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">Browse by Section</h2>
          </div>
          <div className="space-y-8">
            {collections.map((collection) => (
              <div key={collection.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">
                    {collection.name}
                    {collection.nameKreyol && collection.nameKreyol !== collection.name && (
                      <span className="text-gray-500 ml-2 text-xl">
                        ({collection.nameKreyol})
                      </span>
                    )}
                  </h3>
                  <Badge variant="outline">
                    {collection._count.songs} songs
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {collection.sections.map((section) => (
                    <Link key={section.id} href={`/sections/${section.id}`}>
                      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <h4 className="font-medium line-clamp-2">
                          {section.name}
                        </h4>
                        {section.nameKreyol && section.nameKreyol !== section.name && (
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {section.nameKreyol}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {section._count.songs} songs
                        </p>
                      </Card>
                    </Link>
                  ))}
                  {collection.sections.length >= 5 && (
                    <Link href={`/sections/all?collection=${collection.id}`}>
                      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center">
                          <p className="font-medium text-primary">View All</p>
                          <p className="text-sm text-gray-500 mt-1">
                            See all sections
                          </p>
                        </div>
                      </Card>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search by title, number, lyrics, or author..."
          className="h-14 pl-12 pr-4 text-lg"
          disabled
        />
      </div>
    </div>
  );
}
