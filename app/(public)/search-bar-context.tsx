"use client";

import { createContext, useContext, MutableRefObject } from "react";

// Create a context to share the search bar ref
export const SearchBarContext = createContext<MutableRefObject<{ focus: () => void } | null> | null>(null);

export function useSearchBar() {
    return useContext(SearchBarContext);
}
