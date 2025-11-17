"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Music, Hash, User, Feather } from "lucide-react"

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
  matchContext: MatchContext[]
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  selectedIndex: number
  onSelect: (songId: string) => void
  onHover: (index: number) => void
}

/**
 * Highlight matching text in a string
 */
function highlightText(text: string, query: string) {
  if (!query || !text) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="bg-yellow-200 text-gray-900 font-semibold">
          {part}
        </mark>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/**
 * Get icon for match context type
 */
function getContextIcon(type: MatchContext["type"]) {
  switch (type) {
    case "title":
      return <Music className="h-3 w-3" />
    case "number":
      return <Hash className="h-3 w-3" />
    case "author":
      return <Feather className="h-3 w-3" />
    case "composer":
      return <User className="h-3 w-3" />
    case "lyrics":
      return <Music className="h-3 w-3" />
    default:
      return null
  }
}

/**
 * Get label for match context type
 */
function getContextLabel(context: MatchContext) {
  switch (context.type) {
    case "title":
      return "Title"
    case "number":
      return "Number"
    case "author":
      return "Author"
    case "composer":
      return "Composer"
    case "lyrics":
      return context.verseLabel || "Lyrics"
    default:
      return ""
  }
}

export function SearchResults({
  results,
  query,
  selectedIndex,
  onSelect,
  onHover,
}: SearchResultsProps) {
  const resultsRef = React.useRef<HTMLDivElement>(null)

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [selectedIndex])

  return (
    <div
      ref={resultsRef}
      className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-[500px] overflow-y-auto"
    >
      {results.map((result, index) => (
        <button
          key={result.id}
          type="button"
          onClick={() => onSelect(result.id)}
          onMouseEnter={() => onHover(index)}
          className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
            index === selectedIndex
              ? "bg-purple-50 border-l-4 border-l-purple-500"
              : "hover:bg-gray-50 border-l-4 border-l-transparent"
          }`}
        >
          {/* Song Title and Metadata */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {highlightText(result.title, query)}
                {result.titleKreyol && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({highlightText(result.titleKreyol, query)})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                {result.songNumber && (
                  <span className="font-medium">#{result.songNumber}</span>
                )}
                {result.section && <span>{result.section.name}</span>}
                {result.collection && (
                  <span className="text-gray-400">• {result.collection.name}</span>
                )}
              </div>
            </div>

            {/* Status Badge (for admin mode) */}
            {result.status !== "PUBLISHED" && (
              <Badge
                variant={result.status === "DRAFT" ? "secondary" : "outline"}
                className="text-xs"
              >
                {result.status}
              </Badge>
            )}
          </div>

          {/* Author/Composer */}
          {(result.author || result.composer) && (
            <div className="text-xs text-gray-600 mb-2">
              {result.author && (
                <span>By {highlightText(result.author, query)}</span>
              )}
              {result.author && result.composer && " • "}
              {result.composer && (
                <span>Music: {highlightText(result.composer, query)}</span>
              )}
            </div>
          )}

          {/* Match Context */}
          {result.matchContext && result.matchContext.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {result.matchContext.slice(0, 3).map((context, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-gray-50 rounded px-2 py-1.5 flex items-start gap-2"
                >
                  <div className="flex items-center gap-1 text-gray-500 min-w-fit mt-0.5">
                    {getContextIcon(context.type)}
                    <span className="font-medium">
                      {getContextLabel(context)}:
                    </span>
                  </div>
                  <div className="text-gray-700 flex-1 line-clamp-2">
                    {highlightText(context.text, query)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
