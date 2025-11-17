"use client"

import * as React from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SearchResults } from "./search-results"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchBarProps {
  onSelect?: (songId: string) => void
  placeholder?: string
  adminMode?: boolean
  autoFocus?: boolean
  className?: string
}

export interface SearchResult {
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
  matchContext: Array<{
    type: "title" | "lyrics" | "author" | "composer" | "number"
    text: string
    verseType?: string
    verseLabel?: string
    lineNumber?: number
  }>
}

export function SearchBar({
  onSelect,
  placeholder = "Search songs by title, lyrics, author...",
  adminMode = false,
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)

  const searchBarRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Debounce the search query
  const debouncedQuery = useDebounce(query, 300)

  // Perform search when debounced query changes
  React.useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setResults([])
      setIsOpen(false)
      return
    }

    async function performSearch() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: debouncedQuery,
            limit: 10,
            includeVerses: true,
            adminMode,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setIsOpen(true)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, adminMode])

  // Handle keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen || results.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelect(results[selectedIndex].id)
          }
          break
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, results, selectedIndex])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (songId: string) => {
    setIsOpen(false)
    setQuery("")
    setResults([])
    setSelectedIndex(-1)
    onSelect?.(songId)
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchBarRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : query.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <SearchResults
          results={results}
          query={query}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onHover={setSelectedIndex}
        />
      )}

      {isOpen && !isLoading && query.length > 0 && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-4 text-center text-sm text-gray-500">
            No songs found for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  )
}
