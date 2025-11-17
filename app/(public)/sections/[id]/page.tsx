import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music } from "lucide-react";

interface SectionPageProps {
  params: Promise<{ id: string }>;
}

async function getSection(id: string) {
  // Handle "all" sections view
  if (id === "all") {
    return null;
  }

  const section = await prisma.section.findUnique({
    where: { id, isActive: true },
    include: {
      collection: true,
      songs: {
        where: { status: "PUBLISHED" },
        orderBy: { songNumber: "asc" },
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
      },
    },
  });

  return section;
}

async function getAllSections(collectionId?: string) {
  return prisma.collection.findMany({
    where: {
      isActive: true,
      ...(collectionId ? { id: collectionId } : {}),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          nameKreyol: true,
          description: true,
          _count: {
            select: {
              songs: {
                where: { status: "PUBLISHED" },
              },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { id } = await params;

  if (id === "all") {
    return {
      title: "Browse All Sections - Chant d'Espérance",
      description: "Browse hymns organized by collection and section",
    };
  }

  const section = await getSection(id);

  if (!section) {
    return {
      title: "Section Not Found",
    };
  }

  return {
    title: `${section.name} - ${section.collection.name} - Chant d'Espérance`,
    description: section.description || `Browse hymns in ${section.name}`,
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { id } = await params;

  // Show all sections view
  if (id === "all") {
    const collections = await getAllSections();

    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Browse All Sections</h1>
            <p className="text-gray-600 mt-2">
              Explore hymns organized by collection and section
            </p>
          </div>

          <div className="space-y-12">
            {collections.map((collection) => (
              <div key={collection.id}>
                <h2 className="text-3xl font-bold mb-6">
                  {collection.name}
                  {collection.nameKreyol && collection.nameKreyol !== collection.name && (
                    <span className="text-gray-500 ml-2 text-2xl">
                      ({collection.nameKreyol})
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collection.sections.map((section) => (
                    <Link key={section.id} href={`/sections/${section.id}`}>
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <h3 className="text-xl font-semibold mb-2">
                          {section.name}
                        </h3>
                        {section.nameKreyol && section.nameKreyol !== section.name && (
                          <p className="text-gray-600 mb-3">{section.nameKreyol}</p>
                        )}
                        {section.description && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {section.description}
                          </p>
                        )}
                        <Badge variant="secondary">
                          {section._count.songs} songs
                        </Badge>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show individual section
  const section = await getSection(id);

  if (!section) {
    notFound();
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/sections/all">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Sections
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-2">
                {section.collection.name}
                {section.collection.nameKreyol &&
                  section.collection.nameKreyol !== section.collection.name && (
                    <span> ({section.collection.nameKreyol})</span>
                  )}
              </div>
              <h1 className="text-4xl font-bold mb-2">{section.name}</h1>
              {section.nameKreyol && section.nameKreyol !== section.name && (
                <h2 className="text-2xl text-gray-600 mb-4">{section.nameKreyol}</h2>
              )}
              {section.description && (
                <p className="text-gray-600">{section.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {section.songs.length} songs
            </Badge>
          </div>
        </div>

        {/* Songs List */}
        <div className="space-y-3">
          {section.songs.length === 0 ? (
            <Card className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No songs in this section yet.</p>
            </Card>
          ) : (
            section.songs.map((song) => (
              <Link key={song.id} href={`/songs/${song.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Badge variant="secondary" className="text-lg px-3 py-1 flex-shrink-0">
                        #{song.songNumber}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold line-clamp-1">
                            {song.title}
                          </h3>
                          {song.language && (
                            <Badge variant="outline" className="flex-shrink-0">
                              {song.language === "FRANCAIS"
                                ? "FR"
                                : song.language === "KREYOL"
                                ? "KR"
                                : "Bilingual"}
                            </Badge>
                          )}
                        </div>
                        {song.titleKreyol && song.titleKreyol !== song.title && (
                          <p className="text-gray-600 line-clamp-1 mb-2">
                            {song.titleKreyol}
                          </p>
                        )}
                        {(song.firstLine || song.firstLineKreyol) && (
                          <p className="text-sm text-gray-500 line-clamp-1 italic">
                            {song.firstLine || song.firstLineKreyol}
                          </p>
                        )}
                      </div>
                    </div>
                    {song._count.favorites > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                        <span>{song._count.favorites}</span>
                        <span>❤️</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
