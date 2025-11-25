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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [collections, setCollections] = React.useState<Collection[]>([])
  const [sections, setSections] = React.useState<Section[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedCollection, setSelectedCollection] = React.useState<string | null>(null)
  const [editingCollection, setEditingCollection] = React.useState<string | null>(null)
  const [editingSection, setEditingSection] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Collection form state
  const [collectionForm, setCollectionForm] = React.useState({
    name: "",
    nameKreyol: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  })

  // Section form state
  const [sectionForm, setSectionForm] = React.useState({
    name: "",
    nameKreyol: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  })

  // Redirect non-admin users
  React.useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      toast.error("Access denied. Admin privileges required.")
      router.push("/admin")
    }
  }, [session, status, router])

  React.useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchCollections()
    }
  }, [session])

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

  // Effect to populate collection form when editing
  React.useEffect(() => {
    if (editingCollection && editingCollection !== "new") {
      const collection = collections.find((c) => c.id === editingCollection)
      if (collection) {
        setCollectionForm({
          name: collection.name,
          nameKreyol: collection.nameKreyol || "",
          description: collection.description || "",
          sortOrder: collection.sortOrder,
          isActive: collection.isActive,
        })
      }
    } else if (editingCollection === "new") {
      setCollectionForm({
        name: "",
        nameKreyol: "",
        description: "",
        sortOrder: collections.length,
        isActive: true,
      })
    }
  }, [editingCollection, collections])

  // Effect to populate section form when editing
  React.useEffect(() => {
    if (editingSection && editingSection !== "new") {
      const section = sections.find((s) => s.id === editingSection)
      if (section) {
        setSectionForm({
          name: section.name,
          nameKreyol: section.nameKreyol || "",
          description: section.description || "",
          sortOrder: section.sortOrder,
          isActive: section.isActive,
        })
      }
    } else if (editingSection === "new") {
      setSectionForm({
        name: "",
        nameKreyol: "",
        description: "",
        sortOrder: sections.length,
        isActive: true,
      })
    }
  }, [editingSection, sections])

  const handleSaveCollection = async () => {
    if (!collectionForm.name.trim()) {
      toast.error("Collection name is required")
      return
    }

    setSaving(true)
    try {
      const isNew = editingCollection === "new"
      const url = isNew ? "/api/collections" : `/api/collections/${editingCollection}`
      const method = isNew ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectionForm),
      })

      if (!response.ok) throw new Error("Failed to save collection")

      toast.success(`Collection ${isNew ? "created" : "updated"} successfully`)
      setEditingCollection(null)
      fetchCollections()
    } catch (error) {
      console.error("Error saving collection:", error)
      toast.error("Failed to save collection")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSection = async () => {
    if (!sectionForm.name.trim()) {
      toast.error("Section name is required")
      return
    }

    if (!selectedCollection) {
      toast.error("Please select a collection first")
      return
    }

    setSaving(true)
    try {
      const isNew = editingSection === "new"
      const url = isNew ? "/api/sections" : `/api/sections/${editingSection}`
      const method = isNew ? "POST" : "PUT"

      const body = isNew
        ? { ...sectionForm, collectionId: selectedCollection }
        : sectionForm

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Failed to save section")

      toast.success(`Section ${isNew ? "created" : "updated"} successfully`)
      setEditingSection(null)
      fetchSections(selectedCollection)
    } catch (error) {
      console.error("Error saving section:", error)
      toast.error("Failed to save section")
    } finally {
      setSaving(false)
    }
  }

  // Show loading while checking authorization
  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      </div>
    )
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

      {/* Collection Edit/Create Dialog */}
      <Dialog open={editingCollection !== null} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCollection === "new" ? "Add Collection" : "Edit Collection"}
            </DialogTitle>
            <DialogDescription>
              {editingCollection === "new"
                ? "Create a new collection for organizing songs."
                : "Update the collection details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Name *</Label>
              <Input
                id="collection-name"
                value={collectionForm.name}
                onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                placeholder="e.g., Hymnal 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-name-kreyol">Name (Kreyol)</Label>
              <Input
                id="collection-name-kreyol"
                value={collectionForm.nameKreyol}
                onChange={(e) => setCollectionForm({ ...collectionForm, nameKreyol: e.target.value })}
                placeholder="e.g., Kantik 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={collectionForm.description}
                onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-sort-order">Sort Order</Label>
              <Input
                id="collection-sort-order"
                type="number"
                value={collectionForm.sortOrder}
                onChange={(e) => setCollectionForm({ ...collectionForm, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCollection(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveCollection} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Edit/Create Dialog */}
      <Dialog open={editingSection !== null} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSection === "new" ? "Add Section" : "Edit Section"}
            </DialogTitle>
            <DialogDescription>
              {editingSection === "new"
                ? "Create a new section within the selected collection."
                : "Update the section details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Name *</Label>
              <Input
                id="section-name"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                placeholder="e.g., Worship"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-name-kreyol">Name (Kreyol)</Label>
              <Input
                id="section-name-kreyol"
                value={sectionForm.nameKreyol}
                onChange={(e) => setSectionForm({ ...sectionForm, nameKreyol: e.target.value })}
                placeholder="e.g., Adore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-sort-order">Sort Order</Label>
              <Input
                id="section-sort-order"
                type="number"
                value={sectionForm.sortOrder}
                onChange={(e) => setSectionForm({ ...sectionForm, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveSection} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
