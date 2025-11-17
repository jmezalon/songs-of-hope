import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authorization";
import { SongDisplay } from "@/components/songs/song-display";
import { SongActions } from "@/components/songs/song-actions";

interface SongPageProps {
  params: Promise<{ id: string }>;
}

async function getSong(id: string) {
  const song = await prisma.song.findUnique({
    where: { id },
    include: {
      verses: {
        include: {
          lines: {
            orderBy: { lineNumber: "asc" },
          },
        },
        orderBy: { verseNumber: "asc" },
      },
      themes: {
        include: {
          theme: true,
        },
      },
      biblicalRefs: {
        include: {
          biblicalReference: true,
        },
        orderBy: {
          biblicalReference: {
            book: "asc",
          },
        },
      },
      media: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
      section: {
        include: {
          collection: true,
        },
      },
      companionSong: {
        select: {
          id: true,
          songNumber: true,
          title: true,
          titleKreyol: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  if (!song) {
    return null;
  }

  // Only show published songs to non-admin users
  const user = await getCurrentUser();
  if (song.status !== "PUBLISHED" && (!user || (user.role !== "ADMIN" && user.role !== "CONTRIBUTOR"))) {
    return null;
  }

  return song;
}

async function checkFavorite(songId: string, userId: string | undefined) {
  if (!userId) return false;

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_songId: {
        userId,
        songId,
      },
    },
  });

  return !!favorite;
}

export async function generateMetadata({ params }: SongPageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    return {
      title: "Song Not Found",
    };
  }

  const title = song.title || song.titleKreyol || `Song #${song.songNumber}`;
  const description = song.firstLine || song.firstLineKreyol || "View lyrics and details";
  const imageUrl = song.media?.find((m: { type: string }) => m.type === "IMAGE")?.url || "/og-image.png";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://chant-desperance.org"),
    title: `${song.songNumber}. ${title} - Chant d'Espérance`,
    description,
    openGraph: {
      title: `${song.songNumber}. ${title}`,
      description,
      type: "music.song",
      url: `/songs/${id}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} song preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${song.songNumber}. ${title}`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SongPage({ params }: SongPageProps) {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    notFound();
  }

  const user = await getCurrentUser();
  const isFavorite = await checkFavorite(song.id, user?.id);

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Song Actions Bar */}
        <SongActions
          songId={song.id}
          songNumber={song.songNumber}
          title={song.title || song.titleKreyol || "Untitled"}
          isFavorite={isFavorite}
          userId={user?.id}
        />

        {/* Song Display */}
        <SongDisplay song={song} />
      </div>
    </div>
  );
}
