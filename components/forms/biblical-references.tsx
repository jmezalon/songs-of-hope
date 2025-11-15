"use client"

import * as React from "react"
import { Plus, Trash2, Book } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BIBLE_BOOKS, formatBiblicalReference } from "@/lib/constants/song"
import type { BiblicalReference } from "@/lib/validations/song"

interface BiblicalReferencesProps {
  references: BiblicalReference[]
  onChange: (references: BiblicalReference[]) => void
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createEmptyReference(): BiblicalReference {
  return {
    id: generateId(),
    book: "Psalm",
    chapter: 1,
    verseStart: 1,
    verseEnd: undefined,
  }
}

export function BiblicalReferences({ references, onChange }: BiblicalReferencesProps) {
  const handleAdd = () => {
    onChange([...references, createEmptyReference()])
  }

  const handleRemove = (id: string) => {
    onChange(references.filter((ref) => ref.id !== id))
  }

  const handleUpdate = (id: string, updates: Partial<BiblicalReference>) => {
    onChange(
      references.map((ref) =>
        ref.id === id ? { ...ref, ...updates } : ref
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* Added References */}
      {references.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Book className="h-4 w-4" />
            <span>Scripture References ({references.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {references.map((ref) => (
              <Badge
                key={ref.id}
                variant="outline"
                className="bg-blue-50 text-blue-900 border-blue-200"
              >
                {formatBiblicalReference(ref)}
                <button
                  type="button"
                  onClick={() => handleRemove(ref.id)}
                  className="ml-2 hover:text-blue-700"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add New Reference Form */}
      {references.map((ref, index) => (
        <div
          key={ref.id}
          className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Reference {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(ref.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {/* Book Selection */}
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor={`book-${ref.id}`}>Book</Label>
              <Select
                id={`book-${ref.id}`}
                value={ref.book}
                onChange={(e) => handleUpdate(ref.id, { book: e.target.value })}
              >
                <optgroup label="Old Testament">
                  {BIBLE_BOOKS.filter((b) => b.testament === "OT").map((book) => (
                    <option key={book.value} value={book.value}>
                      {book.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="New Testament">
                  {BIBLE_BOOKS.filter((b) => b.testament === "NT").map((book) => (
                    <option key={book.value} value={book.value}>
                      {book.label}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </div>

            {/* Chapter */}
            <div className="space-y-2">
              <Label htmlFor={`chapter-${ref.id}`}>Chapter</Label>
              <Input
                id={`chapter-${ref.id}`}
                type="number"
                min="1"
                value={ref.chapter}
                onChange={(e) =>
                  handleUpdate(ref.id, { chapter: parseInt(e.target.value) || 1 })
                }
                placeholder="1"
              />
            </div>

            {/* Verse Start */}
            <div className="space-y-2">
              <Label htmlFor={`verse-start-${ref.id}`}>Verse</Label>
              <Input
                id={`verse-start-${ref.id}`}
                type="number"
                min="1"
                value={ref.verseStart}
                onChange={(e) =>
                  handleUpdate(ref.id, { verseStart: parseInt(e.target.value) || 1 })
                }
                placeholder="1"
              />
            </div>
          </div>

          {/* Optional Verse End */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 sm:col-start-3 space-y-2">
              <Label htmlFor={`verse-end-${ref.id}`}>
                End Verse (optional)
              </Label>
              <Input
                id={`verse-end-${ref.id}`}
                type="number"
                min={ref.verseStart}
                value={ref.verseEnd || ""}
                onChange={(e) =>
                  handleUpdate(ref.id, {
                    verseEnd: e.target.value
                      ? parseInt(e.target.value) || undefined
                      : undefined,
                  })
                }
                placeholder={`e.g., ${ref.verseStart + 1}`}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="text-sm text-gray-600">
            Preview: <span className="font-medium">{formatBiblicalReference(ref)}</span>
          </div>
        </div>
      ))}

      {/* Add Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Scripture Reference
      </Button>
    </div>
  )
}
