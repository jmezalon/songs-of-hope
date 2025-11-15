"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { THEMES, groupThemesByCategory, type ThemeCategory } from "@/lib/constants/themes"
import { X } from "lucide-react"

interface ThemeSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

const CATEGORY_LABELS: Record<ThemeCategory, string> = {
  OCCASION: "Occasions",
  SEASON: "Seasons",
  TOPIC: "Topics",
  MOOD: "Moods & Styles",
  LITURGICAL: "Liturgical",
}

export function ThemeSelector({ selectedIds, onChange }: ThemeSelectorProps) {
  const groupedThemes = groupThemesByCategory()
  const selectedThemes = THEMES.filter((t) => selectedIds.includes(t.id))

  const handleToggle = (themeId: string) => {
    if (selectedIds.includes(themeId)) {
      onChange(selectedIds.filter((id) => id !== themeId))
    } else {
      onChange([...selectedIds, themeId])
    }
  }

  const handleRemove = (themeId: string) => {
    onChange(selectedIds.filter((id) => id !== themeId))
  }

  return (
    <div className="space-y-4">
      {/* Selected Themes */}
      {selectedThemes.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <span className="text-sm font-medium text-purple-900 w-full mb-1">
            Selected ({selectedThemes.length}):
          </span>
          {selectedThemes.map((theme) => (
            <Badge
              key={theme.id}
              variant="secondary"
              className="bg-purple-100 text-purple-800 hover:bg-purple-200"
            >
              {theme.name}
              <button
                type="button"
                onClick={() => handleRemove(theme.id)}
                className="ml-1 hover:text-purple-900"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Theme Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        {(Object.entries(groupedThemes) as [ThemeCategory, typeof THEMES[number][]][]).map(
          ([category, themes]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                {CATEGORY_LABELS[category]}
              </h4>
              <div className="space-y-2">
                {themes.map((theme) => (
                  <Checkbox
                    key={theme.id}
                    id={`theme-${theme.id}`}
                    checked={selectedIds.includes(theme.id)}
                    onChange={() => handleToggle(theme.id)}
                    label={
                      <span>
                        {theme.name}
                        {theme.nameKreyol && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({theme.nameKreyol})
                          </span>
                        )}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
