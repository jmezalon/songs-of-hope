import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAdmin } from "@/lib/authorization"

// Validation schema for search request
const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(100).optional().default(10),
  includeVerses: z.boolean().optional().default(true),
  adminMode: z.boolean().optional().default(false), // Search all statuses in admin
})

interface MatchContext {
  type: "title" | "lyrics" | "author" | "composer" | "number"
  text: string
  verseType?: string
  verseLabel?: string
  lineNumber?: number
}

interface SearchResult {
  id: string
  title: string
  titleKreyol: string | null
  songNumber: number | null
  author: string | null
  composer: string | null
  firstLine: string | null
  firstLineKreyol: string | null
  language: string
  status: string
  collection: {
    name: string
  }
  section: {
    name: string
  } | null
  relevanceScore: number
  matchedFields: string[]
  matchContext: MatchContext[] // Where the match was found
  similarity?: number // Trigram similarity score
}

/**
 * Calculate relevance score and match context based on where the match was found
 */
function calculateRelevance(
  song: any,
  query: string,
  verses?: any[]
): { score: number; matchedFields: string[]; matchContext: MatchContext[] } {
  const lowerQuery = query.toLowerCase()
  let score = 0
  const matchedFields: string[] = []
  const matchContext: MatchContext[] = []

  // Title matches (highest priority)
  if (song.title?.toLowerCase().includes(lowerQuery)) {
    score += 100
    matchedFields.push("title")
    matchContext.push({
      type: "title",
      text: song.title,
    })
    // Exact match bonus
    if (song.title.toLowerCase() === lowerQuery) {
      score += 50
    }
  }

  if (song.titleKreyol?.toLowerCase().includes(lowerQuery)) {
    score += 100
    matchedFields.push("titleKreyol")
    matchContext.push({
      type: "title",
      text: song.titleKreyol,
    })
  }

  // First line matches (high priority)
  if (song.firstLine?.toLowerCase().includes(lowerQuery)) {
    score += 80
    matchedFields.push("firstLine")
    if (!matchContext.some(c => c.type === "lyrics" && c.text === song.firstLine)) {
      matchContext.push({
        type: "lyrics",
        text: song.firstLine,
        verseLabel: "First line",
      })
    }
  }

  if (song.firstLineKreyol?.toLowerCase().includes(lowerQuery)) {
    score += 80
    matchedFields.push("firstLineKreyol")
    if (!matchContext.some(c => c.type === "lyrics" && c.text === song.firstLineKreyol)) {
      matchContext.push({
        type: "lyrics",
        text: song.firstLineKreyol,
        verseLabel: "First line (Kreyòl)",
      })
    }
  }

  // Author/Composer matches (medium priority)
  if (song.author?.toLowerCase().includes(lowerQuery)) {
    score += 50
    matchedFields.push("author")
    matchContext.push({
      type: "author",
      text: song.author,
    })
  }

  if (song.composer?.toLowerCase().includes(lowerQuery)) {
    score += 50
    matchedFields.push("composer")
    matchContext.push({
      type: "composer",
      text: song.composer,
    })
  }

  // Song number match (exact match only, medium priority)
  const queryNumber = parseInt(query)
  if (!isNaN(queryNumber) && song.songNumber === queryNumber) {
    score += 60
    matchedFields.push("songNumber")
    matchContext.push({
      type: "number",
      text: `#${song.songNumber}`,
    })
  }

  // Verse content matches (lower priority)
  if (verses && verses.length > 0) {
    let lyricsContextAdded = 0
    for (const verse of verses) {
      if (verse.lines && verse.lines.length > 0) {
        for (const line of verse.lines) {
          if (line.text?.toLowerCase().includes(lowerQuery) || line.textKreyol?.toLowerCase().includes(lowerQuery)) {
            score += 20
            if (!matchedFields.includes("lyrics")) {
              matchedFields.push("lyrics")
            }

            // Only add first 3 matching lyrics to context
            if (lyricsContextAdded < 3) {
              const matchedText = line.text?.toLowerCase().includes(lowerQuery) ? line.text : line.textKreyol
              matchContext.push({
                type: "lyrics",
                text: matchedText || "",
                verseType: verse.type,
                verseLabel: verse.label || `${verse.type} ${verse.verseNumber || ""}`.trim(),
                lineNumber: line.lineNumber,
              })
              lyricsContextAdded++
            }
          }
        }
      }
    }
  }

  // Popularity bonus (small boost)
  score += Math.min(song.viewCount / 100, 10)

  return { score, matchedFields, matchContext }
}

// POST /api/search - Search songs by title, lyrics, author
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const { query, limit, includeVerses, adminMode } = searchSchema.parse(body)

    if (adminMode) {
      const adminUser = await requireAdmin().catch(() => null)
      if (!adminUser) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        )
      }
    }

    const lowerQuery = query.toLowerCase()

    // Build OR conditions for search
    const orConditions: any[] = [
      { title: { contains: query, mode: "insensitive" } },
      { titleKreyol: { contains: query, mode: "insensitive" } },
      { firstLine: { contains: query, mode: "insensitive" } },
      { firstLineKreyol: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { composer: { contains: query, mode: "insensitive" } },
    ]

    // Add song number search if query is a number
    const queryNumber = parseInt(query)
    if (!isNaN(queryNumber)) {
      orConditions.push({ songNumber: queryNumber })
    }

    // Build where clause for database query
    const where: any = {
      AND: [
        // In admin mode, search all songs; otherwise only published
        ...(adminMode ? [] : [{ status: "PUBLISHED" }]),
        {
          OR: orConditions,
        },
      ],
    }

    // Fetch matching songs
    let songs = await prisma.song.findMany({
      where,
      include: {
        collection: {
          select: {
            name: true,
            nameKreyol: true,
          },
        },
        section: {
          select: {
            name: true,
            nameKreyol: true,
          },
        },
        verses: includeVerses
          ? {
              include: {
                lines: {
                  orderBy: { lineNumber: "asc" },
                },
              },
              orderBy: { sortOrder: "asc" },
            }
          : false,
      },
      take: limit * 2, // Fetch more than needed for ranking
    })

    // If searching in verses and no results found in basic fields, search verse content
    if (includeVerses && songs.length === 0) {
      const songsWithMatchingVerses = await prisma.song.findMany({
        where: {
          ...(adminMode ? {} : { status: "PUBLISHED" }),
          verses: {
            some: {
              lines: {
                some: {
                  OR: [
                    { text: { contains: query, mode: "insensitive" } },
                    { textKreyol: { contains: query, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        },
        include: {
          collection: {
            select: {
              name: true,
              nameKreyol: true,
            },
          },
          section: {
            select: {
              name: true,
              nameKreyol: true,
            },
          },
          verses: {
            include: {
              lines: {
                orderBy: { lineNumber: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        take: limit * 2,
      })

      songs = songsWithMatchingVerses
    }

    // Calculate relevance scores and rank results
    const rankedResults: SearchResult[] = songs.map((song) => {
      const { score, matchedFields, matchContext } = calculateRelevance(
        song,
        query,
        includeVerses ? song.verses : undefined
      )

      return {
        id: song.id,
        title: song.title,
        titleKreyol: song.titleKreyol,
        songNumber: song.songNumber,
        author: song.author,
        composer: song.composer,
        firstLine: song.firstLine,
        firstLineKreyol: song.firstLineKreyol,
        language: song.language,
        status: song.status,
        collection: {
          name: song.collection.name,
        },
        section: song.section
          ? {
              name: song.section.name,
            }
          : null,
        relevanceScore: score,
        matchedFields,
        matchContext,
      }
    })

    // Sort by relevance score (descending) and limit results
    const sortedResults = rankedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    // Save search history (optional - don't block the response)
    if (sortedResults.length > 0) {
      prisma.searchHistory
        .create({
          data: {
            query,
            resultCount: sortedResults.length,
            songId: sortedResults[0].id, // Link to top result
          },
        })
        .catch((error) => {
          console.error("Failed to save search history:", error)
        })
    }

    return NextResponse.json({
      query,
      results: sortedResults,
      total: sortedResults.length,
    })
  } catch (error) {
    console.error("Error searching songs:", error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to search songs",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET /api/search - Alternative GET endpoint for simple searches with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || searchParams.get("query")
    const limit = parseInt(searchParams.get("limit") || "20")
    const includeVerses = searchParams.get("includeVerses") === "true"
    const language = searchParams.get("language")
    const collectionId = searchParams.get("collectionId")
    const sectionId = searchParams.get("sectionId")

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' or 'query' is required" },
        { status: 400 }
      )
    }

    const lowerQuery = query.toLowerCase()

    // Build OR conditions for search
    const orConditions: any[] = [
      { title: { contains: query, mode: "insensitive" } },
      { titleKreyol: { contains: query, mode: "insensitive" } },
      { firstLine: { contains: query, mode: "insensitive" } },
      { firstLineKreyol: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { composer: { contains: query, mode: "insensitive" } },
    ]

    // Add song number search if query is a number
    const queryNumber = parseInt(query)
    if (!isNaN(queryNumber)) {
      orConditions.push({ songNumber: queryNumber })
    }

    // Build where clause with filters
    const andConditions: any[] = [
      { status: "PUBLISHED" },
      { OR: orConditions },
    ]

    // Add optional filters
    if (language && language !== "all") {
      andConditions.push({ language })
    }
    if (collectionId && collectionId !== "all") {
      andConditions.push({ collectionId })
    }
    if (sectionId && sectionId !== "all") {
      andConditions.push({ sectionId })
    }

    const where: any = {
      AND: andConditions,
    }

    // Fetch matching songs
    let songs = await prisma.song.findMany({
      where,
      include: {
        collection: {
          select: {
            name: true,
            nameKreyol: true,
          },
        },
        section: {
          select: {
            name: true,
            nameKreyol: true,
          },
        },
        verses: includeVerses
          ? {
              include: {
                lines: {
                  orderBy: { lineNumber: "asc" },
                },
              },
              orderBy: { sortOrder: "asc" },
            }
          : false,
      },
      take: limit * 2,
    })

    // If searching in verses and no results found in basic fields, search verse content
    if (includeVerses && songs.length === 0) {
      const verseSearchWhere: any = {
        status: "PUBLISHED",
        verses: {
          some: {
            lines: {
              some: {
                OR: [
                  { text: { contains: query, mode: "insensitive" } },
                  { textKreyol: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      }

      if (language && language !== "all") verseSearchWhere.language = language
      if (collectionId && collectionId !== "all") verseSearchWhere.collectionId = collectionId
      if (sectionId && sectionId !== "all") verseSearchWhere.sectionId = sectionId

      const songsWithMatchingVerses = await prisma.song.findMany({
        where: verseSearchWhere,
        include: {
          collection: {
            select: {
              name: true,
              nameKreyol: true,
            },
          },
          section: {
            select: {
              name: true,
              nameKreyol: true,
            },
          },
          verses: {
            include: {
              lines: {
                orderBy: { lineNumber: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        take: limit * 2,
      })

      songs = songsWithMatchingVerses
    }

    // Calculate relevance scores and rank results
    const rankedResults: SearchResult[] = songs.map((song) => {
      const { score, matchedFields, matchContext } = calculateRelevance(
        song,
        query,
        includeVerses ? song.verses : undefined
      )

      return {
        id: song.id,
        title: song.title,
        titleKreyol: song.titleKreyol,
        songNumber: song.songNumber,
        author: song.author,
        composer: song.composer,
        firstLine: song.firstLine,
        firstLineKreyol: song.firstLineKreyol,
        language: song.language,
        status: song.status,
        collection: {
          name: song.collection.name,
        },
        section: song.section
          ? {
              name: song.section.name,
            }
          : null,
        relevanceScore: score,
        matchedFields,
        matchContext,
      }
    })

    // Sort by relevance score (descending) and limit results
    const sortedResults = rankedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return NextResponse.json({
      query,
      results: sortedResults,
      total: sortedResults.length,
    })
  } catch (error) {
    console.error("Error in GET search:", error)
    return NextResponse.json(
      {
        error: "Failed to search songs",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
