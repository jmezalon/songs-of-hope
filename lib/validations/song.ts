import { z } from "zod"

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

export const defaultValues: Partial<SongFormValues> = {
  songType: "hymnal",
  language: "FRANCAIS",
  copyrightStatus: "UNKNOWN",
  timeSignature: "4/4",
}
