import { z } from "zod"

// Lyric line schema
export const lineSchema = z.object({
  id: z.string(),
  text: z.string(),
  textKreyol: z.string().optional(),
  lineNumber: z.number(),
  isIndented: z.boolean().default(false),
  indent: z.number().default(0),
})

// Lyric verse schema
export const verseSchema = z.object({
  id: z.string(),
  type: z.enum(["VERSE", "CHORUS", "REFRAIN", "BRIDGE", "PRE_CHORUS", "INTRO", "OUTRO"]),
  verseNumber: z.number().optional(),
  label: z.string(),
  labelKreyol: z.string().optional(),
  sortOrder: z.number(),
  isRepeated: z.boolean().default(false),
  lines: z.array(lineSchema),
})

// Biblical reference schema
export const biblicalReferenceSchema = z.object({
  id: z.string(),
  book: z.string(),
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(),
  verseEnd: z.number().int().positive().optional(),
})

// Media schema
export const mediaSchema = z.object({
  id: z.string(),
  type: z.enum(["SHEET_MUSIC", "AUDIO", "VIDEO", "IMAGE"]),
  url: z.string().url(),
  title: z.string().optional(),
})

export const songFormSchema = z.object({
  // Step 1: Song Type & Basic Info
  songType: z.enum(["hymnal", "popular"]),

  // Conditional fields for hymnal songs
  sectionId: z.string().optional(),
  songNumber: z.number().int().positive().optional(),
  language: z.enum(["FRANCAIS", "KREYOL", "BILINGUAL"]).optional(),

  // Basic info
  title: z.string().min(1, "Title is required"),
  titleKreyol: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleKreyol: z.string().optional(),
  companionSongId: z.string().optional(),

  // Step 2: Musical Information
  tune: z.string().optional(),
  meter: z.string().optional(),
  musicalKey: z.string().optional(),
  timeSignature: z.string().optional(),
  tempo: z.string().optional(),

  // Step 3: Credits
  author: z.string().optional(),
  authorKreyol: z.string().optional(),
  composer: z.string().optional(),
  translator: z.string().optional(),
  arranger: z.string().optional(),
  yearWritten: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
  copyrightStatus: z.enum(["PUBLIC_DOMAIN", "COPYRIGHTED", "CREATIVE_COMMONS", "UNKNOWN"]),
  copyrightInfo: z.string().optional(),
  ccliNumber: z.string().optional(),

  // Step 4: Lyrics
  verses: z.array(verseSchema).default([]),

  // Step 5: Themes & Categorization
  themeIds: z.array(z.string()).default([]),
  difficulty: z.enum(["EASY", "MODERATE", "HARD"]).optional(),

  // Step 6: Biblical References
  biblicalReferences: z.array(biblicalReferenceSchema).default([]),

  // Step 7: Media (Optional)
  media: z.array(mediaSchema).default([]),

  // Additional metadata
  firstLine: z.string().optional(),
  firstLineKreyol: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PENDING_REVIEW"]).default("DRAFT"),
}).refine(
  (data) => {
    // If song type is hymnal, section and number are required
    if (data.songType === "hymnal") {
      return data.sectionId && data.songNumber && data.language
    }
    return true
  },
  {
    message: "Section, song number, and language are required for hymnal songs",
    path: ["sectionId"],
  }
)

export type SongFormValues = z.infer<typeof songFormSchema>

export type LyricLine = z.infer<typeof lineSchema>
export type LyricVerse = z.infer<typeof verseSchema>
export type BiblicalReference = z.infer<typeof biblicalReferenceSchema>
export type MediaItem = z.infer<typeof mediaSchema>

export const defaultValues: Partial<SongFormValues> = {
  songType: "hymnal",
  language: "FRANCAIS",
  copyrightStatus: "UNKNOWN",
  timeSignature: "4/4",
  verses: [],
  themeIds: [],
  biblicalReferences: [],
  media: [],
  status: "DRAFT",
}

