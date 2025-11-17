import { LyricVerse, LyricLine } from "./validations/song";

interface ParsedSection {
  type: "VERSE" | "CHORUS" | "REFRAIN" | "BRIDGE" | "PRE_CHORUS" | "INTRO" | "OUTRO";
  verseNumber?: number;
  lines: string[];
}

/**
 * Detects the verse type and number from a potential section header
 */
function detectSectionType(line: string): ParsedSection | null {
  const trimmed = line.trim().toLowerCase();

  // Skip empty lines
  if (!trimmed) return null;

  // Verse patterns
  const versePatterns = [
    /^verse\s*(\d+)/i,
    /^v\.?\s*(\d+)/i,
    /^(\d+)\.\s*$/,  // Just a number like "1."
    /^vèse\s*(\d+)/i,  // Haitian Creole
  ];

  for (const pattern of versePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: "VERSE",
        verseNumber: parseInt(match[1]),
        lines: []
      };
    }
  }

  // Chorus/Refrain patterns (including Haitian Creole "Kè")
  const chorusPatterns = [
    /^chorus/i,
    /^refrain/i,
    /^kè/i,  // Haitian Creole for chorus/refrain
    /^kè\s*(\d+)/i,
  ];

  for (const pattern of chorusPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: match[1] ? "CHORUS" : "REFRAIN",  // If numbered, treat as chorus
        lines: []
      };
    }
  }

  // Bridge
  if (/^bridge/i.test(trimmed) || /^pon/i.test(trimmed)) {
    return {
      type: "BRIDGE",
      lines: []
    };
  }

  // Pre-Chorus
  if (/^pre[-\s]?chorus/i.test(trimmed)) {
    return {
      type: "PRE_CHORUS",
      lines: []
    };
  }

  // Intro
  if (/^intro/i.test(trimmed) || /^entwodiksyon/i.test(trimmed)) {
    return {
      type: "INTRO",
      lines: []
    };
  }

  // Outro
  if (/^outro/i.test(trimmed) || /^konklizyon/i.test(trimmed)) {
    return {
      type: "OUTRO",
      lines: []
    };
  }

  return null;
}

/**
 * Generates a unique ID for verses and lines
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a label for a verse based on its type and number
 */
function createLabel(type: ParsedSection["type"], verseNumber?: number): string {
  switch (type) {
    case "VERSE":
      return verseNumber ? `Verse ${verseNumber}` : "Verse";
    case "CHORUS":
      return "Chorus";
    case "REFRAIN":
      return "Refrain";
    case "BRIDGE":
      return "Bridge";
    case "PRE_CHORUS":
      return "Pre-Chorus";
    case "INTRO":
      return "Intro";
    case "OUTRO":
      return "Outro";
    default:
      return "Verse";
  }
}

/**
 * Parses pasted lyrics text and converts it into structured verses with lines.
 *
 * Features:
 * - Empty lines create new sections
 * - Keywords (verse, chorus, refrain, bridge, kè, etc.) create appropriate section types
 * - New lines within sections become lyric lines
 * - Supports both English and Haitian Creole section markers
 *
 * @param text - The pasted lyrics text
 * @param startingSortOrder - The sort order to start from (default: 0)
 * @returns Array of LyricVerse objects
 */
export function parseSmartLyrics(text: string, startingSortOrder: number = 0): LyricVerse[] {
  const verses: LyricVerse[] = [];
  const lines = text.split('\n');

  let currentSection: ParsedSection | null = null;
  let defaultVerseNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this line is a section header
    const detectedSection = detectSectionType(line);

    if (detectedSection) {
      // Save current section if exists
      if (currentSection && currentSection.lines.length > 0) {
        verses.push(convertToLyricVerse(currentSection, verses.length + startingSortOrder));
      }

      // Start new section
      currentSection = detectedSection;
      continue;
    }

    // Empty line creates a new section (if current section has content)
    if (!trimmedLine) {
      if (currentSection && currentSection.lines.length > 0) {
        verses.push(convertToLyricVerse(currentSection, verses.length + startingSortOrder));
        currentSection = null;
      }
      continue;
    }

    // Regular lyric line
    if (!currentSection) {
      // No section yet, create a default verse
      currentSection = {
        type: "VERSE",
        verseNumber: defaultVerseNumber++,
        lines: []
      };
    }

    currentSection.lines.push(line);
  }

  // Don't forget the last section
  if (currentSection && currentSection.lines.length > 0) {
    verses.push(convertToLyricVerse(currentSection, verses.length + startingSortOrder));
  }

  return verses;
}

/**
 * Converts a ParsedSection to a LyricVerse
 */
function convertToLyricVerse(section: ParsedSection, sortOrder: number): LyricVerse {
  const lines: LyricLine[] = section.lines.map((text, index) => ({
    id: generateId(),
    text: text.trimEnd(), // Preserve leading spaces for indentation, remove trailing
    textKreyol: "",
    lineNumber: index,
    isIndented: false,
    indent: 0
  }));

  return {
    id: generateId(),
    type: section.type,
    verseNumber: section.verseNumber,
    label: createLabel(section.type, section.verseNumber),
    labelKreyol: "",
    sortOrder,
    isRepeated: false,
    lines
  };
}
