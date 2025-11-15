// Mock theme data (will be replaced with API calls)
export const THEMES = [
  // Occasions
  { id: "1", name: "Christmas", nameKreyol: "Nwèl", category: "OCCASION" },
  { id: "2", name: "Easter", nameKreyol: "Pak", category: "OCCASION" },
  { id: "3", name: "Baptism", nameKreyol: "Batèm", category: "OCCASION" },
  { id: "4", name: "Communion", nameKreyol: "Kominyon", category: "OCCASION" },
  { id: "5", name: "Wedding", nameKreyol: "Maryaj", category: "OCCASION" },
  { id: "6", name: "Funeral", nameKreyol: "Antèman", category: "OCCASION" },
  { id: "7", name: "New Year", nameKreyol: "Nouvo Ane", category: "OCCASION" },

  // Seasons
  { id: "8", name: "Advent", nameKreyol: "Avan", category: "SEASON" },
  { id: "9", name: "Lent", nameKreyol: "Karèm", category: "SEASON" },
  { id: "10", name: "Pentecost", nameKreyol: "Lafetlasentespri", category: "SEASON" },

  // Topics
  { id: "11", name: "Praise & Worship", nameKreyol: "Lwanj ak Adore", category: "TOPIC" },
  { id: "12", name: "Prayer", nameKreyol: "Lapriyè", category: "TOPIC" },
  { id: "13", name: "Thanksgiving", nameKreyol: "Aksyon de Gras", category: "TOPIC" },
  { id: "14", name: "Faith", nameKreyol: "Lafwa", category: "TOPIC" },
  { id: "15", name: "Hope", nameKreyol: "Espwa", category: "TOPIC" },
  { id: "16", name: "Love", nameKreyol: "Lanmou", category: "TOPIC" },
  { id: "17", name: "Grace", nameKreyol: "Lagrasa", category: "TOPIC" },
  { id: "18", name: "Salvation", nameKreyol: "Sali", category: "TOPIC" },
  { id: "19", name: "Repentance", nameKreyol: "Repanti", category: "TOPIC" },
  { id: "20", name: "Revival", nameKreyol: "Revèy", category: "TOPIC" },

  // Moods
  { id: "21", name: "Joyful", nameKreyol: "Kontan", category: "MOOD" },
  { id: "22", name: "Contemplative", nameKreyol: "Meditasyon", category: "MOOD" },
  { id: "23", name: "Penitential", nameKreyol: "Repantans", category: "MOOD" },
  { id: "24", name: "Triumphant", nameKreyol: "Viktwa", category: "MOOD" },
  { id: "25", name: "Peaceful", nameKreyol: "Lapè", category: "MOOD" },

  // Liturgical
  { id: "26", name: "Opening Hymn", nameKreyol: "Chan Ouvèti", category: "LITURGICAL" },
  { id: "27", name: "Closing Hymn", nameKreyol: "Chan Fèmti", category: "LITURGICAL" },
  { id: "28", name: "Communion Hymn", nameKreyol: "Chan Kominyon", category: "LITURGICAL" },
  { id: "29", name: "Offering", nameKreyol: "Ofrand", category: "LITURGICAL" },
] as const

export type ThemeCategory = "OCCASION" | "SEASON" | "TOPIC" | "MOOD" | "LITURGICAL"

export function groupThemesByCategory() {
  const grouped: Record<ThemeCategory, typeof THEMES[number][]> = {
    OCCASION: [],
    SEASON: [],
    TOPIC: [],
    MOOD: [],
    LITURGICAL: [],
  }

  THEMES.forEach((theme) => {
    grouped[theme.category].push(theme)
  })

  return grouped
}
