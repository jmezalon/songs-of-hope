// Re-export Prisma types for convenience
export type {
  Collection,
  Section,
  Song,
  Verse,
  Line,
  Theme,
  SongTheme,
  BiblicalReference,
  SongBiblicalReference,
  Media,
  User,
  Favorite,
  Playlist,
  PlaylistSong,
  SearchHistory,
  Contribution,
} from '@prisma/client'

export {
  Language,
  SongStatus,
  CopyrightStatus,
  VerseType,
  ThemeCategory,
  MediaType,
  UserRole,
  ContributionStatus,
  ContributionType,
} from '@prisma/client'

// Extended types with relations
export type SongWithDetails = {
  id: string
  title: string
  titleKreyol?: string | null
  subtitle?: string | null
  subtitleKreyol?: string | null
  collectionId: string
  sectionId?: string | null
  songNumber?: number | null
  language: string
  companionSongId?: string | null
  tune?: string | null
  meter?: string | null
  musicalKey?: string | null
  timeSignature?: string | null
  tempo?: string | null
  author?: string | null
  authorKreyol?: string | null
  composer?: string | null
  translator?: string | null
  arranger?: string | null
  yearWritten?: number | null
  copyrightStatus: string
  copyrightInfo?: string | null
  firstLine?: string | null
  firstLineKreyol?: string | null
  summary?: string | null
  notes?: string | null
  popularityScore: number
  viewCount: number
  favoriteCount: number
  status: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
  collection: {
    id: string
    name: string
    nameKreyol?: string | null
  }
  section?: {
    id: string
    name: string
    nameKreyol?: string | null
  } | null
  verses: Array<{
    id: string
    type: string
    verseNumber?: number | null
    label?: string | null
    labelKreyol?: string | null
    sortOrder: number
    isRepeated: boolean
    lines: Array<{
      id: string
      text: string
      textKreyol?: string | null
      lineNumber: number
      isIndented: boolean
      indent: number
    }>
  }>
  themes: Array<{
    theme: {
      id: string
      name: string
      nameKreyol?: string | null
      category: string
    }
  }>
  companionSong?: {
    id: string
    title: string
    titleKreyol?: string | null
    language: string
  } | null
}

export type SongListItem = {
  id: string
  title: string
  titleKreyol?: string | null
  songNumber?: number | null
  language: string
  firstLine?: string | null
  firstLineKreyol?: string | null
  section?: {
    name: string
    nameKreyol?: string | null
  } | null
  collection: {
    name: string
  }
  favoriteCount: number
  viewCount: number
}

export type CollectionWithSections = {
  id: string
  name: string
  nameKreyol?: string | null
  description?: string | null
  sortOrder: number
  isActive: boolean
  sections: Array<{
    id: string
    name: string
    nameKreyol?: string | null
    sortOrder: number
    _count: {
      songs: number
    }
  }>
  _count: {
    songs: number
  }
}

export type SectionWithSongs = {
  id: string
  name: string
  nameKreyol?: string | null
  description?: string | null
  sortOrder: number
  collection: {
    id: string
    name: string
    nameKreyol?: string | null
  }
  songs: SongListItem[]
}

export type PlaylistWithSongs = {
  id: string
  name: string
  description?: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name?: string | null
    email: string
  }
  songs: Array<{
    sortOrder: number
    addedAt: Date
    song: SongListItem
  }>
}

export type UserProfile = {
  id: string
  email: string
  name?: string | null
  role: string
  preferredLanguage?: string | null
  createdAt: Date
  _count: {
    favorites: number
    playlists: number
    contributions: number
  }
}

// Search types
export type SearchFilters = {
  query?: string
  collectionId?: string
  sectionId?: string
  language?: string
  themeIds?: string[]
  status?: string
  sortBy?: 'relevance' | 'title' | 'songNumber' | 'popularity' | 'recent'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export type SearchResult = {
  songs: SongListItem[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// API Response types
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Form types
export type SongFormData = {
  title: string
  titleKreyol?: string
  subtitle?: string
  subtitleKreyol?: string
  collectionId: string
  sectionId?: string
  songNumber?: number
  language: string
  companionSongId?: string
  tune?: string
  meter?: string
  musicalKey?: string
  timeSignature?: string
  tempo?: string
  author?: string
  authorKreyol?: string
  composer?: string
  translator?: string
  arranger?: string
  yearWritten?: number
  copyrightStatus: string
  copyrightInfo?: string
  firstLine?: string
  firstLineKreyol?: string
  summary?: string
  notes?: string
  status: string
  verses: VerseFormData[]
  themeIds: string[]
}

export type VerseFormData = {
  id?: string
  type: string
  verseNumber?: number
  label?: string
  labelKreyol?: string
  sortOrder: number
  isRepeated: boolean
  repeatAfterVerse?: number
  lines: LineFormData[]
}

export type LineFormData = {
  id?: string
  text: string
  textKreyol?: string
  lineNumber: number
  isIndented: boolean
  indent: number
}

// Contribution types
export type ContributionData = {
  type: string
  songId?: string
  title?: string
  description?: string
  changes?: Record<string, unknown>
  newSongData?: Partial<SongFormData>
}
