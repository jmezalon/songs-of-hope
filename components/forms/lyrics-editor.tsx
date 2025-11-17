"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, Trash2, GripVertical, IndentDecrease, IndentIncrease, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { LyricLine, LyricVerse } from "@/lib/validations/song"

interface LyricsEditorProps {
  verses: LyricVerse[]
  onChange: (verses: LyricVerse[]) => void
  language?: "FRANCAIS" | "KREYOL" | "BILINGUAL" | "ENGLISH" | "SPANISH"
}

const VERSE_TYPES = [
  { value: "VERSE", label: "Verse" },
  { value: "CHORUS", label: "Chorus" },
  { value: "REFRAIN", label: "Refrain" },
  { value: "BRIDGE", label: "Bridge" },
  { value: "PRE_CHORUS", label: "Pre-Chorus" },
  { value: "INTRO", label: "Intro" },
  { value: "OUTRO", label: "Outro" },
] as const

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createEmptyLine(lineNumber: number): LyricLine {
  return {
    id: generateId(),
    text: "",
    textKreyol: "",
    lineNumber,
    isIndented: false,
    indent: 0,
  }
}

function createEmptyVerse(sortOrder: number): LyricVerse {
  return {
    id: generateId(),
    type: "VERSE",
    verseNumber: sortOrder + 1,
    label: `Verse ${sortOrder + 1}`,
    labelKreyol: `Vès ${sortOrder + 1}`,
    sortOrder,
    isRepeated: false,
    lines: [createEmptyLine(1)],
  }
}

// Sortable Line Component
interface SortableLineProps {
  line: LyricLine
  verseId: string
  language?: "FRANCAIS" | "KREYOL" | "BILINGUAL" | "ENGLISH" | "SPANISH"
  onUpdate: (id: string, updates: Partial<LyricLine>) => void
  onRemove: (id: string) => void
  canRemove: boolean
}

function SortableLine({ line, verseId, language, onUpdate, onRemove, canRemove }: SortableLineProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const showKreyol = language === "BILINGUAL" || language === "KREYOL"

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 group">
      <button
        type="button"
        className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Input
            value={line.text}
            onChange={(e) => onUpdate(line.id, { text: e.target.value })}
            placeholder={language === "KREYOL" ? "Enter Kreyòl text..." : "Enter French text..."}
            className="flex-1"
            style={{ paddingLeft: `${line.indent * 16 + 12}px` }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUpdate(line.id, { indent: Math.max(0, line.indent - 1) })}
            disabled={line.indent === 0}
            title="Decrease indent"
          >
            <IndentDecrease className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUpdate(line.id, { indent: Math.min(4, line.indent + 1) })}
            disabled={line.indent >= 4}
            title="Increase indent"
          >
            <IndentIncrease className="h-4 w-4" />
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(line.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showKreyol && (
          <Input
            value={line.textKreyol || ""}
            onChange={(e) => onUpdate(line.id, { textKreyol: e.target.value })}
            placeholder="Enter Kreyòl translation..."
            className="flex-1"
            style={{ paddingLeft: `${line.indent * 16 + 12}px` }}
          />
        )}
      </div>
    </div>
  )
}

// Verse Card Component
interface VerseCardProps {
  verse: LyricVerse
  language?: "FRANCAIS" | "KREYOL" | "BILINGUAL" | "ENGLISH" | "SPANISH"
  onUpdate: (id: string, updates: Partial<LyricVerse>) => void
  onRemove: (id: string) => void
  onAddLine: (verseId: string) => void
  onUpdateLine: (verseId: string, lineId: string, updates: Partial<LyricLine>) => void
  onRemoveLine: (verseId: string, lineId: string) => void
  onReorderLines: (verseId: string, activeId: string, overId: string) => void
  onPasteLines: (verseId: string, pastedText: string, pastedTextKreyol?: string) => void
}

function VerseCard({
  verse,
  language,
  onUpdate,
  onRemove,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onReorderLines,
  onPasteLines,
}: VerseCardProps) {
  const [pastedText, setPastedText] = React.useState("")
  const [pastedTextKreyol, setPastedTextKreyol] = React.useState("")
  const [showPasteArea, setShowPasteArea] = React.useState(verse.lines.length === 1 && !verse.lines[0].text)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handlePaste = () => {
    if (pastedText.trim()) {
      onPasteLines(verse.id, pastedText, pastedTextKreyol || undefined)
      setPastedText("")
      setPastedTextKreyol("")
      setShowPasteArea(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      onReorderLines(verse.id, active.id as string, over.id as string)
    }
  }

  const getTypeLabel = (type: LyricVerse["type"]) => {
    return VERSE_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Verse Type</Label>
              <Select
                value={verse.type}
                onChange={(e) =>
                  onUpdate(verse.id, {
                    type: e.target.value as LyricVerse["type"],
                    label: `${getTypeLabel(e.target.value as LyricVerse["type"])}${
                      verse.verseNumber ? ` ${verse.verseNumber}` : ""
                    }`,
                  })
                }
              >
                {VERSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            {verse.type === "VERSE" && (
              <div className="space-y-2">
                <Label>Verse Number (optional)</Label>
                <Input
                  type="number"
                  value={verse.verseNumber || ""}
                  onChange={(e) =>
                    onUpdate(verse.id, {
                      verseNumber: e.target.value ? parseInt(e.target.value) : undefined,
                      label: e.target.value ? `Verse ${e.target.value}` : "Verse",
                    })
                  }
                  placeholder="e.g., 1"
                />
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(verse.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2">
          <Badge variant="secondary">{verse.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showPasteArea ? (
          <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Paste Entire Verse</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasteArea(false)}
              >
                Switch to line-by-line
              </Button>
            </div>
            <div className="space-y-2">
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={language === "KREYOL" ? "Paste your Kreyòl verse here...\nEach new line will become a lyric line" : "Paste your verse here...\nEach new line will become a lyric line"}
                rows={6}
                className="font-mono"
              />
              {(language === "BILINGUAL" || language === "KREYOL") && (
                <Textarea
                  value={pastedTextKreyol}
                  onChange={(e) => setPastedTextKreyol(e.target.value)}
                  placeholder="Paste Kreyòl translation here...\nEach new line will become a lyric line"
                  rows={6}
                  className="font-mono"
                />
              )}
            </div>
            <Button
              type="button"
              onClick={handlePaste}
              disabled={!pastedText.trim()}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Convert to Lines
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasteArea(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Paste entire verse
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={verse.lines.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                {verse.lines.map((line) => (
                  <SortableLine
                    key={line.id}
                    line={line}
                    verseId={verse.id}
                    language={language}
                    onUpdate={(lineId, updates) => onUpdateLine(verse.id, lineId, updates)}
                    onRemove={(lineId) => onRemoveLine(verse.id, lineId)}
                    canRemove={verse.lines.length > 1}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddLine(verse.id)}
              className="w-full mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Main Lyrics Editor Component
export function LyricsEditor({ verses, onChange, language = "FRANCAIS" }: LyricsEditorProps) {
  const handleAddVerse = () => {
    const newVerse = createEmptyVerse(verses.length)
    onChange([...verses, newVerse])
  }

  const handleRemoveVerse = (id: string) => {
    onChange(verses.filter((v) => v.id !== id))
  }

  const handleUpdateVerse = (id: string, updates: Partial<LyricVerse>) => {
    onChange(verses.map((v) => (v.id === id ? { ...v, ...updates } : v)))
  }

  const handleAddLine = (verseId: string) => {
    onChange(
      verses.map((v) => {
        if (v.id === verseId) {
          const newLine = createEmptyLine(v.lines.length + 1)
          return { ...v, lines: [...v.lines, newLine] }
        }
        return v
      })
    )
  }

  const handleUpdateLine = (verseId: string, lineId: string, updates: Partial<LyricLine>) => {
    onChange(
      verses.map((v) => {
        if (v.id === verseId) {
          return {
            ...v,
            lines: v.lines.map((l) => (l.id === lineId ? { ...l, ...updates } : l)),
          }
        }
        return v
      })
    )
  }

  const handleRemoveLine = (verseId: string, lineId: string) => {
    onChange(
      verses.map((v) => {
        if (v.id === verseId) {
          return {
            ...v,
            lines: v.lines.filter((l) => l.id !== lineId),
          }
        }
        return v
      })
    )
  }

  const handleReorderLines = (verseId: string, activeId: string, overId: string) => {
    onChange(
      verses.map((v) => {
        if (v.id === verseId) {
          const oldIndex = v.lines.findIndex((l) => l.id === activeId)
          const newIndex = v.lines.findIndex((l) => l.id === overId)
          return {
            ...v,
            lines: arrayMove(v.lines, oldIndex, newIndex).map((line, index) => ({
              ...line,
              lineNumber: index + 1,
            })),
          }
        }
        return v
      })
    )
  }

  const handlePasteLines = (verseId: string, pastedText: string, pastedTextKreyol?: string) => {
    onChange(
      verses.map((v) => {
        if (v.id === verseId) {
          // Split pasted text by newlines and filter out empty lines
          const textLines = pastedText.split('\n').filter(line => line.trim())
          const kreyolLines = pastedTextKreyol?.split('\n').filter(line => line.trim()) || []

          // Create new lines from pasted text
          const newLines: LyricLine[] = textLines.map((text, index) => ({
            id: generateId(),
            text: text.trim(),
            textKreyol: kreyolLines[index]?.trim() || "",
            lineNumber: index + 1,
            isIndented: false,
            indent: 0,
          }))

          return {
            ...v,
            lines: newLines,
          }
        }
        return v
      })
    )
  }

  return (
    <div className="space-y-4">
      {verses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600 mb-4">No lyrics added yet. Start by adding a verse, chorus, or other section.</p>
          <Button type="button" onClick={handleAddVerse}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {verses.map((verse) => (
              <VerseCard
                key={verse.id}
                verse={verse}
                language={language}
                onUpdate={handleUpdateVerse}
                onRemove={handleRemoveVerse}
                onAddLine={handleAddLine}
                onUpdateLine={handleUpdateLine}
                onRemoveLine={handleRemoveLine}
                onReorderLines={handleReorderLines}
                onPasteLines={handlePasteLines}
              />
            ))}
          </div>

          <Button type="button" variant="outline" onClick={handleAddVerse} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Section (Verse, Chorus, Bridge, etc.)
          </Button>
        </>
      )}

      {verses.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <p>
            <strong>Tip:</strong> Drag the grip handle to reorder lines within a section. Use the indent buttons to
            format your lyrics.
          </p>
        </div>
      )}
    </div>
  )
}
