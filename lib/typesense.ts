import Typesense from "typesense"
import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections"

/**
 * Typesense Admin Client
 * Used for indexing and management operations (server-side only)
 */
export const typesenseAdminClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
      port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108"),
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY || "xyz",
  connectionTimeoutSeconds: 10,
})

/**
 * Typesense Search Client Configuration
 * Can be used on the client-side with search-only API key
 */
export const typesenseSearchConfig = {
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
      port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108"),
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
    },
  ],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || "xyz",
  connectionTimeoutSeconds: 10,
}

/**
 * Typesense Search Client
 * Used for search operations
 */
export const typesenseSearchClient = new Typesense.Client(typesenseSearchConfig)

/**
 * Collection name for songs
 */
export const SONGS_COLLECTION_NAME = "songs"

/**
 * Songs collection schema
 */
export const songsCollectionSchema: CollectionCreateSchema = {
  name: SONGS_COLLECTION_NAME,
  fields: [
    { name: "title", type: "string", facet: false },
    { name: "titleKreyol", type: "string", facet: false, optional: true },
    { name: "lyrics", type: "string", facet: false, optional: true },
    { name: "lyricsKreyol", type: "string", facet: false, optional: true },
    { name: "songNumber", type: "int32", facet: true, optional: true },
    { name: "language", type: "string", facet: true },
    { name: "collectionId", type: "string", facet: true, optional: true },
    { name: "collectionName", type: "string", facet: true, optional: true },
    { name: "sectionId", type: "string", facet: true, optional: true },
    { name: "sectionName", type: "string", facet: true, optional: true },
    { name: "themes", type: "string[]", facet: true, optional: true },
    { name: "author", type: "string", facet: true, optional: true },
    { name: "composer", type: "string", facet: true, optional: true },
    { name: "createdAt", type: "int64", facet: false },
    { name: "updatedAt", type: "int64", facet: false },
  ],
  default_sorting_field: "createdAt",
}

/**
 * Initialize Typesense collections
 * Creates the songs collection if it doesn't exist
 */
export async function initializeTypesenseCollections() {
  try {
    // Check if collection exists
    try {
      await typesenseAdminClient.collections(SONGS_COLLECTION_NAME).retrieve()
      console.log(`Collection '${SONGS_COLLECTION_NAME}' already exists`)
      return { success: true, message: "Collection already exists" }
    } catch (error) {
      // Collection doesn't exist, create it
      console.log(`Creating collection '${SONGS_COLLECTION_NAME}'...`)
      await typesenseAdminClient.collections().create(songsCollectionSchema)
      console.log(`Collection '${SONGS_COLLECTION_NAME}' created successfully`)
      return { success: true, message: "Collection created successfully" }
    }
  } catch (error) {
    console.error("Error initializing Typesense collections:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Index a single song to Typesense
 */
export async function indexSong(song: any) {
  try {
    const document = {
      id: song.id,
      title: song.title,
      titleKreyol: song.titleKreyol || undefined,
      lyrics: song.lyrics || undefined,
      lyricsKreyol: song.lyricsKreyol || undefined,
      songNumber: song.songNumber || undefined,
      language: song.language,
      collectionId: song.collection?.id || song.collectionId || undefined,
      collectionName: song.collection?.name || undefined,
      sectionId: song.section?.id || song.sectionId || undefined,
      sectionName: song.section?.name || undefined,
      themes: song.themes?.map((t: any) => t.theme?.name || t.name).filter(Boolean) || [],
      author: song.author || undefined,
      composer: song.composer || undefined,
      createdAt: Math.floor(new Date(song.createdAt).getTime() / 1000),
      updatedAt: Math.floor(new Date(song.updatedAt).getTime() / 1000),
    }

    await typesenseAdminClient
      .collections(SONGS_COLLECTION_NAME)
      .documents()
      .upsert(document)

    return { success: true }
  } catch (error) {
    console.error(`Error indexing song ${song.id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Remove a song from Typesense
 */
export async function removeSong(songId: string) {
  try {
    await typesenseAdminClient
      .collections(SONGS_COLLECTION_NAME)
      .documents(songId)
      .delete()

    return { success: true }
  } catch (error) {
    console.error(`Error removing song ${songId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Search songs in Typesense
 */
export async function searchSongs(params: {
  query: string
  filters?: string
  facets?: string[]
  page?: number
  perPage?: number
  sortBy?: string
}) {
  const {
    query,
    filters,
    facets = ["language", "collectionName", "sectionName", "themes"],
    page = 1,
    perPage = 20,
    sortBy,
  } = params

  try {
    const searchParameters = {
      q: query,
      query_by: "title,titleKreyol,lyrics,lyricsKreyol,author,composer",
      filter_by: filters,
      facet_by: facets.join(","),
      page,
      per_page: perPage,
      sort_by: sortBy,
      // Typesense features
      num_typos: 2, // Allow up to 2 typos
      typo_tokens_threshold: 1, // Minimum word length before typos are considered
      drop_tokens_threshold: 1, // Drop tokens to get results
      prefix: true, // Enable prefix searching (autocomplete)
      highlight_full_fields: "title,titleKreyol",
      snippet_threshold: 30,
      exhaustive_search: false,
    }

    const searchResults = await typesenseSearchClient
      .collections(SONGS_COLLECTION_NAME)
      .documents()
      .search(searchParameters)

    return { success: true, results: searchResults }
  } catch (error) {
    console.error("Error searching songs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
