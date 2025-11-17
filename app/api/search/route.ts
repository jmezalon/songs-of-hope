import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for search request
const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(100).optional().default(20),
  includeVerses: z.boolean().optional().default(false),
})

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
  collection: {
    name: string
  }
  section: {
    name: string
  } | null
  relevanceScore: number
  matchedFields: string[]
}

/**
 * Calculate relevance score based on where the match was found
 */
function calculateRelevance(
  song: any,
  query: string,
  verses?: any[]
): { score: number; matchedFields: string[] } {
  const lowerQuery = query.toLowerCase()
  let score = 0
  const matchedFields: string[] = []

  // Title matches (highest priority)
  if (song.title?.toLowerCase().includes(lowerQuery)) {
    score += 100
    matchedFields.push("title")
    // Exact match bonus
    if (song.title.toLowerCase() === lowerQuery) {
      score += 50
    }
  }

  if (song.titleKreyol?.toLowerCase().includes(lowerQuery)) {
    score += 100
    matchedFields.push("titleKreyol")
  }

  // First line matches (high priority)
  if (song.firstLine?.toLowerCase().includes(lowerQuery)) {
    score += 80
    matchedFields.push("firstLine")
  }

  if (song.firstLineKreyol?.toLowerCase().includes(lowerQuery)) {
    score += 80
    matchedFields.push("firstLineKreyol")
  }

  // Author/Composer matches (medium priority)
  if (song.author?.toLowerCase().includes(lowerQuery)) {
    score += 50
    matchedFields.push("author")
  }

  if (song.composer?.toLowerCase().includes(lowerQuery)) {
    score += 50
    matchedFields.push("composer")
  }

  // Song number match (exact match only, medium priority)
  const queryNumber = parseInt(query)
  if (!isNaN(queryNumber) && song.songNumber === queryNumber) {
    score += 60
    matchedFields.push("songNumber")
  }

  // Verse content matches (lower priority)
  if (verses && verses.length > 0) {
    for (const verse of verses) {
      if (verse.lines && verse.lines.length > 0) {
        for (const line of verse.lines) {
          if (line.text?.toLowerCase().includes(lowerQuery)) {
            score += 20
            if (!matchedFields.includes("lyrics")) {
              matchedFields.push("lyrics")
            }
          }
          if (line.textKreyol?.toLowerCase().includes(lowerQuery)) {
            score += 20
            if (!matchedFields.includes("lyricsKreyol")) {
              matchedFields.push("lyricsKreyol")
            }
          }
        }
      }
    }
  }

  // Popularity bonus (small boost)
  score += Math.min(song.viewCount / 100, 10)

  return { score, matchedFields }
}

// POST /api/search - Search songs by title, lyrics, author
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const { query, limit, includeVerses } = searchSchema.parse(body)

    const lowerQuery = query.toLowerCase()

    // Build where clause for database query
    const where: any = {
      AND: [
        { status: "PUBLISHED" }, // Only search published songs
        {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { titleKreyol: { contains: query, mode: "insensitive" } },
            { firstLine: { contains: query, mode: "insensitive" } },
            { firstLineKreyol: { contains: query, mode: "insensitive" } },
            { author: { contains: query, mode: "insensitive" } },
            { composer: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    }

    // Add song number search if query is a number
    const queryNumber = parseInt(query)
    if (!isNaN(queryNumber)) {
      where.AND[1].OR.push({ songNumber: queryNumber })
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
      const { score, matchedFields } = calculateRelevance(
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

// GET /api/search - Alternative GET endpoint for simple searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || searchParams.get("query")
    const limit = parseInt(searchParams.get("limit") || "20")
    const includeVerses = searchParams.get("includeVerses") === "true"

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' or 'query' is required" },
        { status: 400 }
      )
    }

    // Use the POST handler logic
    return POST(
      new NextRequest(request.url, {
        method: "POST",
        body: JSON.stringify({ query, limit, includeVerses }),
      })
    )
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
