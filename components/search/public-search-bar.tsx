"use client";

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface ApiSearchResult {
  id: string
  songNumber: number | null
  title: string
  titleKreyol?: string | null
  firstLine?: string | null
  firstLineKreyol?: string | null
  language?: string | null
  relevanceScore: number
  matchContext?: Array<{ type: string; text: string }>
}

interface SearchResult {
  id: string
  songNumber: number | null
  title: string
  titleKreyol?: string | null
  firstLine?: string | null
  firstLineKreyol?: string | null
  language?: string | null
  relevanceScore: number
  matchContext?: string
}

export function PublicSearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.ok) {
          const data = await response.json()
          const apiResults: ApiSearchResult[] = data.results || data.songs || []
          const normalizedResults: SearchResult[] = apiResults.map((song) => ({
            ...song,
            matchContext: song.matchContext?.[0]?.text,
          }))
          setResults(normalizedResults)
          setIsOpen(normalizedResults.length > 0)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          router.push(`/songs/${results[selectedIndex].id}`);
          setIsOpen(false);
          setQuery("");
        } else if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultClick = (songId: string) => {
    router.push(`/songs/${songId}`);
    setIsOpen(false);
    setQuery("");
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={dropdownRef} className="w-full max-w-2xl mx-auto relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search by title, number, lyrics, or author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && query.trim()) {
              setIsOpen(true);
            }
          }}
          className="h-14 pl-12 pr-12 text-lg shadow-lg"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto shadow-xl z-50">
          <div className="p-2">
            {results.map((song, index) => (
              <div
                key={song.id}
                onClick={() => handleResultClick(song.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedIndex === index ? "bg-primary/10" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        #{song.songNumber}
                      </Badge>
                      {song.language && (
                        <Badge variant="outline" className="text-xs">
                          {song.language === "FRANCAIS" ? "FR" : song.language === "KREYOL" ? "KR" : "Bilingual"}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-base line-clamp-1">
                      {highlightMatch(song.title, query)}
                    </h4>
                    {song.titleKreyol && song.titleKreyol !== song.title && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {highlightMatch(song.titleKreyol, query)}
                      </p>
                    )}
                    {(song.firstLine || song.firstLineKreyol) && (
                      <p className="text-sm text-gray-500 line-clamp-1 italic mt-1">
                        {highlightMatch(song.firstLine || song.firstLineKreyol || "", query)}
                      </p>
                    )}
                    {song.matchContext && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {song.matchContext}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {song.relevanceScore}% match
                  </div>
                </div>
              </div>
            ))}
          </div>
          {results.length > 0 && (
            <div className="border-t p-3 bg-gray-50 text-center text-sm text-gray-600">
              Press <kbd className="px-2 py-1 bg-white border rounded">Enter</kbd> to see all results
            </div>
          )}
        </Card>
      )}

      {/* No Results */}
      {isOpen && !isLoading && results.length === 0 && query.trim().length >= 2 && (
        <Card className="absolute top-full mt-2 w-full p-6 text-center shadow-xl z-50">
          <p className="text-gray-500">No songs found for &quot;{query}&quot;</p>
          <p className="text-sm text-gray-400 mt-2">
            Try searching by title, number, lyrics, or author
          </p>
        </Card>
      )}
    </div>
  );
}
