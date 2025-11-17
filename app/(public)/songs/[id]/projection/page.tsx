import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authorization";
import { ProjectionView } from "@/components/songs/projection-view";

interface ProjectionPageProps {
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

export async function generateMetadata({ params }: ProjectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    return {
      title: "Song Not Found",
    };
  }

  return {
    title: `Projection: ${song.songNumber}. ${song.title || song.titleKreyol || "Untitled"}`,
  };
}

export default async function ProjectionPage({ params }: ProjectionPageProps) {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    notFound();
  }

  return <ProjectionView song={song} />;
}
