"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-advanced";
import { Search, Loader2, X } from "lucide-react";
import Link from "next/link";

interface MatchContext {
  type: "title" | "lyrics" | "author" | "composer" | "number";
  text: string;
  verseType?: string;
  verseLabel?: string;
  lineNumber?: number;
}

interface SearchResult {
  id: string;
  songNumber: number;
  title: string;
  titleKreyol?: string | null;
  firstLine?: string | null;
  firstLineKreyol?: string | null;
  language?: string | null;
  author?: string | null;
  composer?: string | null;
  relevanceScore: number;
  matchContext?: MatchContext[];
  _count?: {
    favorites: number;
  };
}

interface Collection {
  id: string;
  name: string;
  nameKreyol: string | null;
}

interface Section {
  id: string;
  name: string;
  nameKreyol: string | null;
  collectionId: string;
}

export function AdvancedSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [language, setLanguage] = useState(searchParams.get("language") || "all");
  const [collectionId, setCollectionId] = useState(searchParams.get("collection") || "all");
  const [sectionId, setSectionId] = useState(searchParams.get("section") || "all");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);

  // Fetch collections and sections on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionsRes, sectionsRes] = await Promise.all([
          fetch("/api/collections"),
          fetch("/api/sections"),
        ]);

        if (collectionsRes.ok) {
          const data = await collectionsRes.json();
          setCollections(data.collections || []);
        }

        if (sectionsRes.ok) {
          const data = await sectionsRes.json();
          setSections(data.sections || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Filter sections based on selected collection
  useEffect(() => {
    if (collectionId === "all") {
      setFilteredSections(sections);
    } else {
      setFilteredSections(sections.filter((s) => s.collectionId === collectionId));
    }
    // Reset section if it's not in the filtered list
    if (sectionId !== "all" && !filteredSections.find((s) => s.id === sectionId)) {
      setSectionId("all");
    }
  }, [collectionId, sections]);

  // Perform search on initial load if query is present
  useEffect(() => {
    if (searchParams.get("q")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.set("q", query);
      if (language !== "all") params.set("language", language);
      if (collectionId !== "all") params.set("collectionId", collectionId);
      if (sectionId !== "all") params.set("sectionId", sectionId);

      const response = await fetch(`/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || data.songs || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setLanguage("all");
    setCollectionId("all");
    setSectionId("all");
    setResults([]);
    setHasSearched(false);
    router.push("/search");
  };

  const hasFilters = query || language !== "all" || collectionId !== "all" || sectionId !== "all";

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Main Search Query */}
          <div className="space-y-2">
            <Label htmlFor="query">Search Query</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="query"
                type="search"
                placeholder="Search by title, lyrics, author, composer, or song number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Language Filter */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="FRANCAIS">Français</SelectItem>
                  <SelectItem value="KREYOL">Kreyòl</SelectItem>
                  <SelectItem value="BILINGUAL">Bilingual</SelectItem>
                  <SelectItem value="ENGLISH">English</SelectItem>
                  <SelectItem value="SPANISH">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Collection Filter */}
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger id="collection">
                  <SelectValue placeholder="All collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Filter */}
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={collectionId === "all" && filteredSections.length === 0}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {filteredSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading || !query.trim()} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
            {hasFilters && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {isLoading ? "Searching..." : `${results.length} Results`}
            </h2>
          </div>

          {results.length === 0 && !isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">
                No songs found matching your search criteria.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters or search terms.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((song) => (
                <Link key={song.id} href={`/songs/${song.id}`}>
                  <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">#{song.songNumber}</Badge>
                          {song.language && (
                            <Badge variant="outline">
                              {song.language === "FRANCAIS"
                                ? "FR"
                                : song.language === "KREYOL"
                                ? "KR"
                                : song.language === "BILINGUAL"
                                ? "Bilingual"
                                : song.language}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {song.relevanceScore}% match
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold line-clamp-1 mb-1">
                          {song.title}
                        </h3>
                        {song.titleKreyol && song.titleKreyol !== song.title && (
                          <p className="text-gray-600 line-clamp-1 mb-2">
                            {song.titleKreyol}
                          </p>
                        )}
                        {(song.author || song.composer) && (
                          <p className="text-sm text-gray-500 mb-2">
                            {song.author && `By ${song.author}`}
                            {song.author && song.composer && " • "}
                            {song.composer && `Music by ${song.composer}`}
                          </p>
                        )}
                        {(song.firstLine || song.firstLineKreyol) && (
                          <p className="text-sm text-gray-500 line-clamp-2 italic">
                            {song.firstLine || song.firstLineKreyol}
                          </p>
                        )}
                        {song.matchContext && song.matchContext.length > 0 && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                            Match: {song.matchContext[0].text}
                          </p>
                        )}
                      </div>
                      {song._count && song._count.favorites > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>{song._count.favorites}</span>
                          <span>❤️</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!hasSearched && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Search Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Search by song number (e.g., "123" or "#123")</li>
            <li>• Search by title in French or Kreyòl</li>
            <li>• Search by lyrics or first line</li>
            <li>• Search by author or composer name</li>
            <li>• Use filters to narrow your results by language, collection, or section</li>
            <li>• Results are ranked by relevance</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
