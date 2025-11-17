"use client"

import * as React from "react"
import { Plus, Edit, Trash2, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"

interface Theme {
  id: string
  name: string
  nameKreyol: string | null
  category: string
  description: string | null
  sortOrder: number
  isActive: boolean
  _count: {
    songs: number
  }
}

const THEME_CATEGORIES = [
  { value: "OCCASION", label: "Occasions" },
  { value: "SEASON", label: "Seasons" },
  { value: "TOPIC", label: "Topics" },
  { value: "LITURGICAL", label: "Liturgical" },
  { value: "CHRISTIAN_LIFE", label: "Christian Life" },
  { value: "WORSHIP", label: "Worship" },
]

export default function ThemesPage() {
  const [themes, setThemes] = React.useState<Theme[]>([])
  const [loading, setLoading] = React.useState(true)
  const [categoryFilter, setCategoryFilter] = React.useState<string>("")

  React.useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      const response = await fetch("/api/themes")
      if (!response.ok) throw new Error("Failed to fetch themes")
      const data = await response.json()
      setThemes(data.themes)
    } catch (error) {
      console.error("Error fetching themes:", error)
      toast.error("Failed to load themes")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this theme? Songs using this theme will be affected.")) {
      return
    }

    try {
      const response = await fetch(`/api/themes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete theme")

      toast.success("Theme deleted successfully")
      fetchThemes()
    } catch (error) {
      console.error("Error deleting theme:", error)
      toast.error("Failed to delete theme")
    }
  }

  const filteredThemes = categoryFilter
    ? themes.filter((theme) => theme.category === categoryFilter)
    : themes

  const themesByCategory = THEME_CATEGORIES.map((category) => ({
    ...category,
    themes: themes.filter((theme) => theme.category === category.value),
  }))

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      OCCASION: "bg-blue-100 text-blue-800",
      SEASON: "bg-green-100 text-green-800",
      TOPIC: "bg-purple-100 text-purple-800",
      LITURGICAL: "bg-red-100 text-red-800",
      CHRISTIAN_LIFE: "bg-yellow-100 text-yellow-800",
      WORSHIP: "bg-pink-100 text-pink-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Themes & Tags</h1>
        <p className="text-muted-foreground">
          Manage song themes and categories
        </p>
      </div>

      {/* Category Overview */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {THEME_CATEGORIES.map((category) => {
          const count = themes.filter((t) => t.category === category.value).length
          return (
            <Card
              key={category.value}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setCategoryFilter(categoryFilter === category.value ? "" : category.value)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  theme{count !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Themes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Themes</CardTitle>
              <CardDescription>
                {categoryFilter
                  ? `${filteredThemes.length} ${THEME_CATEGORIES.find(c => c.value === categoryFilter)?.label} themes`
                  : `${themes.length} total themes`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {categoryFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryFilter("")}
                >
                  Clear Filter
                </Button>
              )}
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Theme
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={10} columns={5} />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Kreyòl Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Songs</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredThemes.map((theme) => (
                      <TableRow key={theme.id}>
                        <TableCell className="font-medium">{theme.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {theme.nameKreyol || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadgeColor(theme.category)}>
                            {THEME_CATEGORIES.find(c => c.value === theme.category)?.label || theme.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {theme._count.songs} songs
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(theme.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredThemes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {categoryFilter
                            ? `No themes in this category yet.`
                            : `No themes yet. Click "Add Theme" to create one.`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Themes by Category (Alternative View) */}
      {!categoryFilter && themes.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {themesByCategory.map((category) => (
            category.themes.length > 0 && (
              <Card key={category.value}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.label}</CardTitle>
                  <CardDescription>
                    {category.themes.length} theme{category.themes.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.themes.map((theme) => (
                      <div
                        key={theme.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-sm">{theme.name}</div>
                          {theme.nameKreyol && (
                            <div className="text-xs text-muted-foreground">
                              {theme.nameKreyol}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {theme._count.songs}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  )
}
