"use client"

import * as React from "react"
import { Plus, Edit, Trash2, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"

interface Collection {
  id: string
  name: string
  nameKreyol: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
  _count: {
    songs: number
    sections: number
  }
}

interface Section {
  id: string
  collectionId: string
  name: string
  nameKreyol: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
  _count: {
    songs: number
  }
}

export default function CollectionsPage() {
  const [collections, setCollections] = React.useState<Collection[]>([])
  const [sections, setSections] = React.useState<Section[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedCollection, setSelectedCollection] = React.useState<string | null>(null)
  const [editingCollection, setEditingCollection] = React.useState<string | null>(null)
  const [editingSection, setEditingSection] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchCollections()
  }, [])

  React.useEffect(() => {
    if (selectedCollection) {
      fetchSections(selectedCollection)
    }
  }, [selectedCollection])

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections")
      if (!response.ok) throw new Error("Failed to fetch collections")
      const data = await response.json()
      setCollections(data.collections)
      if (data.collections.length > 0 && !selectedCollection) {
        setSelectedCollection(data.collections[0].id)
      }
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast.error("Failed to load collections")
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/sections?collectionId=${collectionId}`)
      if (!response.ok) throw new Error("Failed to fetch sections")
      const data = await response.json()
      setSections(data.sections)
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast.error("Failed to load sections")
    }
  }

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection? This will also delete all its sections and may affect songs.")) {
      return
    }

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete collection")

      toast.success("Collection deleted successfully")
      fetchCollections()
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast.error("Failed to delete collection")
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section? This may affect songs.")) {
      return
    }

    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete section")

      toast.success("Section deleted successfully")
      if (selectedCollection) {
        fetchSections(selectedCollection)
      }
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collections & Sections</h1>
        <p className="text-muted-foreground">
          Manage hymnal collections and their sections
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Collections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Collections</CardTitle>
                <CardDescription>
                  {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setEditingCollection("new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Collection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCollection === collection.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedCollection(collection.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{collection.name}</div>
                      {collection.nameKreyol && (
                        <div className="text-sm text-muted-foreground">
                          {collection.nameKreyol}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {collection._count.sections} sections
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {collection._count.songs} songs
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingCollection(collection.id)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCollection(collection.id)
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {collections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No collections yet. Click "Add Collection" to create one.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sections</CardTitle>
                <CardDescription>
                  {selectedCollection ? `${sections.length} section${sections.length !== 1 ? 's' : ''}` : 'Select a collection'}
                </CardDescription>
              </div>
              {selectedCollection && (
                <Button size="sm" onClick={() => setEditingSection("new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCollection ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a collection to view its sections
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{section.name}</div>
                      {section.nameKreyol && (
                        <div className="text-sm text-muted-foreground">
                          {section.nameKreyol}
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs mt-1">
                        {section._count.songs} songs
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSection(section.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sections yet. Click "Add Section" to create one.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
