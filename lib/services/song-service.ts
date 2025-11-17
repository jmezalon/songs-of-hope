import { prisma } from "@/lib/prisma"
import type { SongFormValues } from "@/lib/validations/song"
import type { Prisma, Song } from "@prisma/client"

export class SongServiceError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function getFirstLine(data: SongFormValues) {
  return (
    data.firstLine ||
    data.verses?.[0]?.lines?.[0]?.text ||
    undefined
  )
}

function getFirstLineKreyol(data: SongFormValues) {
  return (
    data.firstLineKreyol ||
    data.verses?.[0]?.lines?.[0]?.textKreyol ||
    undefined
  )
}

async function resolveCollectionId(data: SongFormValues) {
  if (data.songType === "hymnal" && data.sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
      select: { collectionId: true },
    })

    if (!section) {
      throw new SongServiceError("Section not found", 404)
    }

    return section.collectionId
  }

  const popularCollection = await prisma.collection.findFirst({
    where: {
      name: "Popular Songs",
      isActive: true,
    },
    select: { id: true },
  })

  if (!popularCollection) {
    throw new SongServiceError(
      "Popular Songs collection not found. Please create it first.",
      404
    )
  }

  return popularCollection.id
}

async function ensureThemesExist(themeIds: string[] | undefined, tx: Prisma.TransactionClient) {
  if (!themeIds || themeIds.length === 0) {
    return
  }

  const existingThemes = await tx.theme.findMany({
    where: {
      id: {
        in: themeIds,
      },
    },
    select: { id: true },
  })

  const existingThemeIds = existingThemes.map((t) => t.id)
  const invalidThemeIds = themeIds.filter((id) => !existingThemeIds.includes(id))

  if (invalidThemeIds.length > 0) {
    throw new SongServiceError(
      `Invalid theme IDs: ${invalidThemeIds.join(", ")}. Please select valid themes.`,
      400
    )
  }
}

async function persistThemes(themeIds: string[] | undefined, songId: string, tx: Prisma.TransactionClient) {
  if (!themeIds || themeIds.length === 0) {
    return
  }

  await ensureThemesExist(themeIds, tx)

  await tx.songTheme.createMany({
    data: themeIds.map((themeId) => ({
      songId,
      themeId,
    })),
  })
}

async function persistBiblicalRefs(
  references: SongFormValues["biblicalReferences"],
  songId: string,
  tx: Prisma.TransactionClient
) {
  if (!references || references.length === 0) {
    return
  }

  for (const ref of references) {
    const biblicalRef = await tx.biblicalReference.upsert({
      where: {
        id: ref.id,
      },
      update: {},
      create: {
        book: ref.book,
        chapter: ref.chapter,
        verseStart: ref.verseStart,
        verseEnd: ref.verseEnd,
      },
    })

    await tx.songBiblicalReference.create({
      data: {
        songId,
        biblicalReferenceId: biblicalRef.id,
      },
    })
  }
}

async function persistMedia(media: SongFormValues["media"], songId: string, tx: Prisma.TransactionClient) {
  if (!media || media.length === 0) {
    return
  }

  await tx.media.createMany({
    data: media.map((mediaItem, index) => ({
      songId,
      type: mediaItem.type,
      url: mediaItem.url,
      title: mediaItem.title || undefined,
      sortOrder: index,
      isPublic: true,
    })),
  })
}

function baseSongData(data: SongFormValues, collectionId: string) {
  return {
    title: data.title,
    titleKreyol: data.titleKreyol || undefined,
    subtitle: data.subtitle || undefined,
    subtitleKreyol: data.subtitleKreyol || undefined,
    collectionId,
    sectionId: data.sectionId || undefined,
    songNumber: data.songNumber || undefined,
    language: data.language || "BILINGUAL",
    companionSongId: data.companionSongId || undefined,
    tune: data.tune || undefined,
    meter: data.meter || undefined,
    musicalKey: data.musicalKey || undefined,
    timeSignature: data.timeSignature || undefined,
    tempo: data.tempo || undefined,
    author: data.author || undefined,
    authorKreyol: data.authorKreyol || undefined,
    composer: data.composer || undefined,
    translator: data.translator || undefined,
    arranger: data.arranger || undefined,
    yearWritten: data.yearWritten || undefined,
    copyrightStatus: data.copyrightStatus,
    copyrightInfo: data.copyrightInfo || undefined,
    firstLine: getFirstLine(data),
    firstLineKreyol: getFirstLineKreyol(data),
    summary: data.summary || undefined,
    notes: data.notes || undefined,
    difficulty: data.difficulty || undefined,
    status: data.status,
    publishedAt: data.status === "PUBLISHED" ? new Date() : null,
  }
}

async function persistVerses(
  verses: SongFormValues["verses"],
  songId: string,
  tx: Prisma.TransactionClient
) {
  if (!verses || verses.length === 0) {
    return
  }

  for (const verse of verses) {
    const createdVerse = await tx.verse.create({
      data: {
        songId,
        type: verse.type,
        verseNumber: verse.verseNumber || undefined,
        label: verse.label || undefined,
        labelKreyol: verse.labelKreyol || undefined,
        sortOrder: verse.sortOrder,
        isRepeated: verse.isRepeated,
      },
    })

    if (verse.lines && verse.lines.length > 0) {
      await tx.line.createMany({
        data: verse.lines.map((line) => ({
          verseId: createdVerse.id,
          text: line.text,
          textKreyol: line.textKreyol || undefined,
          lineNumber: line.lineNumber,
          isIndented: line.isIndented,
          indent: line.indent,
        })),
      })
    }
  }
}

export async function createSongWithRelations(data: SongFormValues) {
  const collectionId = await resolveCollectionId(data)

  return prisma.$transaction(async (tx) => {
    const createdSong = await tx.song.create({
      data: baseSongData(data, collectionId),
    })

    await persistVerses(data.verses, createdSong.id, tx)
    await persistThemes(data.themeIds, createdSong.id, tx)
    await persistBiblicalRefs(data.biblicalReferences, createdSong.id, tx)
    await persistMedia(data.media, createdSong.id, tx)

    return tx.song.findUnique({
      where: { id: createdSong.id },
      include: {
        verses: {
          include: {
            lines: {
              orderBy: { lineNumber: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
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
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  })
}

export async function updateSongWithRelations(songId: string, data: SongFormValues) {
  const existingSong = await prisma.song.findUnique({ where: { id: songId } })

  if (!existingSong) {
    throw new SongServiceError("Song not found", 404)
  }

  const collectionId = await resolveCollectionId(data)

  return prisma.$transaction(async (tx) => {
    await tx.song.update({
      where: { id: songId },
      data: {
        ...baseSongData(data, collectionId),
        publishedAt:
          data.status === "PUBLISHED" && !existingSong.publishedAt
            ? new Date()
            : existingSong.publishedAt,
      },
    })

    await tx.verse.deleteMany({ where: { songId } })
    await tx.songTheme.deleteMany({ where: { songId } })
    await tx.songBiblicalReference.deleteMany({ where: { songId } })
    await tx.media.deleteMany({ where: { songId } })

    await persistVerses(data.verses, songId, tx)
    await persistThemes(data.themeIds, songId, tx)
    await persistBiblicalRefs(data.biblicalReferences, songId, tx)
    await persistMedia(data.media, songId, tx)

    return tx.song.findUnique({
      where: { id: songId },
      include: {
        verses: {
          include: {
            lines: {
              orderBy: { lineNumber: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
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
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  })
}

export async function ensureSongIsViewable(song: Song | null, userRole?: string) {
  if (!song) {
    throw new SongServiceError("Song not found", 404)
  }

  if (
    song.status !== "PUBLISHED" &&
    userRole !== "ADMIN" &&
    userRole !== "CONTRIBUTOR"
  ) {
    throw new SongServiceError("Song not found", 404)
  }
}
