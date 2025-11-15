// Bible books for biblical reference selector
export const BIBLE_BOOKS = [
  // Old Testament
  { value: "Genesis", label: "Genesis", testament: "OT" },
  { value: "Exodus", label: "Exodus", testament: "OT" },
  { value: "Leviticus", label: "Leviticus", testament: "OT" },
  { value: "Numbers", label: "Numbers", testament: "OT" },
  { value: "Deuteronomy", label: "Deuteronomy", testament: "OT" },
  { value: "Joshua", label: "Joshua", testament: "OT" },
  { value: "Judges", label: "Judges", testament: "OT" },
  { value: "Ruth", label: "Ruth", testament: "OT" },
  { value: "1 Samuel", label: "1 Samuel", testament: "OT" },
  { value: "2 Samuel", label: "2 Samuel", testament: "OT" },
  { value: "1 Kings", label: "1 Kings", testament: "OT" },
  { value: "2 Kings", label: "2 Kings", testament: "OT" },
  { value: "1 Chronicles", label: "1 Chronicles", testament: "OT" },
  { value: "2 Chronicles", label: "2 Chronicles", testament: "OT" },
  { value: "Ezra", label: "Ezra", testament: "OT" },
  { value: "Nehemiah", label: "Nehemiah", testament: "OT" },
  { value: "Esther", label: "Esther", testament: "OT" },
  { value: "Job", label: "Job", testament: "OT" },
  { value: "Psalm", label: "Psalms", testament: "OT" },
  { value: "Proverbs", label: "Proverbs", testament: "OT" },
  { value: "Ecclesiastes", label: "Ecclesiastes", testament: "OT" },
  { value: "Song of Solomon", label: "Song of Solomon", testament: "OT" },
  { value: "Isaiah", label: "Isaiah", testament: "OT" },
  { value: "Jeremiah", label: "Jeremiah", testament: "OT" },
  { value: "Lamentations", label: "Lamentations", testament: "OT" },
  { value: "Ezekiel", label: "Ezekiel", testament: "OT" },
  { value: "Daniel", label: "Daniel", testament: "OT" },
  { value: "Hosea", label: "Hosea", testament: "OT" },
  { value: "Joel", label: "Joel", testament: "OT" },
  { value: "Amos", label: "Amos", testament: "OT" },
  { value: "Obadiah", label: "Obadiah", testament: "OT" },
  { value: "Jonah", label: "Jonah", testament: "OT" },
  { value: "Micah", label: "Micah", testament: "OT" },
  { value: "Nahum", label: "Nahum", testament: "OT" },
  { value: "Habakkuk", label: "Habakkuk", testament: "OT" },
  { value: "Zephaniah", label: "Zephaniah", testament: "OT" },
  { value: "Haggai", label: "Haggai", testament: "OT" },
  { value: "Zechariah", label: "Zechariah", testament: "OT" },
  { value: "Malachi", label: "Malachi", testament: "OT" },

  // New Testament
  { value: "Matthew", label: "Matthew", testament: "NT" },
  { value: "Mark", label: "Mark", testament: "NT" },
  { value: "Luke", label: "Luke", testament: "NT" },
  { value: "John", label: "John", testament: "NT" },
  { value: "Acts", label: "Acts", testament: "NT" },
  { value: "Romans", label: "Romans", testament: "NT" },
  { value: "1 Corinthians", label: "1 Corinthians", testament: "NT" },
  { value: "2 Corinthians", label: "2 Corinthians", testament: "NT" },
  { value: "Galatians", label: "Galatians", testament: "NT" },
  { value: "Ephesians", label: "Ephesians", testament: "NT" },
  { value: "Philippians", label: "Philippians", testament: "NT" },
  { value: "Colossians", label: "Colossians", testament: "NT" },
  { value: "1 Thessalonians", label: "1 Thessalonians", testament: "NT" },
  { value: "2 Thessalonians", label: "2 Thessalonians", testament: "NT" },
  { value: "1 Timothy", label: "1 Timothy", testament: "NT" },
  { value: "2 Timothy", label: "2 Timothy", testament: "NT" },
  { value: "Titus", label: "Titus", testament: "NT" },
  { value: "Philemon", label: "Philemon", testament: "NT" },
  { value: "Hebrews", label: "Hebrews", testament: "NT" },
  { value: "James", label: "James", testament: "NT" },
  { value: "1 Peter", label: "1 Peter", testament: "NT" },
  { value: "2 Peter", label: "2 Peter", testament: "NT" },
  { value: "1 John", label: "1 John", testament: "NT" },
  { value: "2 John", label: "2 John", testament: "NT" },
  { value: "3 John", label: "3 John", testament: "NT" },
  { value: "Jude", label: "Jude", testament: "NT" },
  { value: "Revelation", label: "Revelation", testament: "NT" },
] as const

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Easy", description: "Simple melody, easy to learn" },
  { value: "MODERATE", label: "Moderate", description: "Some musical complexity" },
  { value: "HARD", label: "Hard", description: "Complex harmonies or rhythms" },
] as const

// Media types
export const MEDIA_TYPES = [
  { value: "SHEET_MUSIC", label: "Sheet Music (PDF)", icon: "FileText" },
  { value: "AUDIO", label: "Audio (MP3, WAV)", icon: "Music" },
  { value: "VIDEO", label: "Video (YouTube, Vimeo)", icon: "Video" },
  { value: "IMAGE", label: "Image (JPG, PNG)", icon: "Image" },
] as const

// Helper function to format biblical reference
export function formatBiblicalReference(ref: { book: string; chapter: number; verseStart: number; verseEnd?: number }): string {
  if (ref.verseEnd && ref.verseEnd !== ref.verseStart) {
    return `${ref.book} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`
  }
  return `${ref.book} ${ref.chapter}:${ref.verseStart}`
}
