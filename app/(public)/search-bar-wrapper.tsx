"use client";

import { PublicSearchBar } from "@/components/search/public-search-bar";
import { useSearchBar } from "./search-bar-context";

export function SearchBarWrapper() {
    const searchBarRef = useSearchBar();

    return <PublicSearchBar ref={searchBarRef} />;
}
