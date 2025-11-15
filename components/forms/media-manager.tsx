"use client"

import * as React from "react"
import { Plus, Trash2, FileText, Music, Video, Image as ImageIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MEDIA_TYPES } from "@/lib/constants/song"
import type { MediaItem } from "@/lib/validations/song"

interface MediaManagerProps {
  media: MediaItem[]
  onChange: (media: MediaItem[]) => void
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createEmptyMedia(): MediaItem {
  return {
    id: generateId(),
    type: "SHEET_MUSIC",
    url: "",
    title: "",
  }
}

const MEDIA_ICONS = {
  SHEET_MUSIC: FileText,
  AUDIO: Music,
  VIDEO: Video,
  IMAGE: ImageIcon,
}

export function MediaManager({ media, onChange }: MediaManagerProps) {
  const handleAdd = () => {
    onChange([...media, createEmptyMedia()])
  }

  const handleRemove = (id: string) => {
    onChange(media.filter((item) => item.id !== id))
  }

  const handleUpdate = (id: string, updates: Partial<MediaItem>) => {
    onChange(
      media.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }

  const getMediaLabel = (type: MediaItem["type"]) => {
    return MEDIA_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <div className="space-y-4">
      {/* Added Media */}
      {media.filter((m) => m.url).length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            Added Media ({media.filter((m) => m.url).length})
          </div>
          <div className="space-y-2">
            {media
              .filter((m) => m.url)
              .map((item) => {
                const Icon = MEDIA_ICONS[item.type]
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <Icon className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getMediaLabel(item.type)}
                        </Badge>
                        {item.title && (
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </span>
                        )}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        {item.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Add New Media Form */}
      {media.map((item, index) => {
        if (item.url) return null // Only show empty forms

        return (
          <div
            key={item.id}
            className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Add Media
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Media Type */}
              <div className="space-y-2">
                <Label htmlFor={`media-type-${item.id}`}>Media Type</Label>
                <Select
                  id={`media-type-${item.id}`}
                  value={item.type}
                  onChange={(e) =>
                    handleUpdate(item.id, {
                      type: e.target.value as MediaItem["type"],
                    })
                  }
                >
                  {MEDIA_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor={`media-title-${item.id}`}>
                  Title (optional)
                </Label>
                <Input
                  id={`media-title-${item.id}`}
                  value={item.title || ""}
                  onChange={(e) =>
                    handleUpdate(item.id, { title: e.target.value })
                  }
                  placeholder="e.g., Sheet Music PDF"
                />
              </div>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor={`media-url-${item.id}`}>
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`media-url-${item.id}`}
                value={item.url}
                onChange={(e) => handleUpdate(item.id, { url: e.target.value })}
                placeholder={
                  item.type === "VIDEO"
                    ? "https://youtube.com/watch?v=..."
                    : item.type === "SHEET_MUSIC"
                    ? "https://example.com/sheet-music.pdf"
                    : "https://example.com/media"
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                {item.type === "VIDEO" && "YouTube, Vimeo, or direct video link"}
                {item.type === "AUDIO" && "MP3, WAV, or streaming service link"}
                {item.type === "SHEET_MUSIC" && "PDF file or Google Drive link"}
                {item.type === "IMAGE" && "JPG, PNG, or image hosting link"}
              </p>
            </div>
          </div>
        )
      })}

      {/* Add Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Media Link
      </Button>

      <p className="text-xs text-gray-500">
        Add links to sheet music PDFs, YouTube videos, audio recordings, or images.
        Files can be uploaded to Google Drive, Dropbox, or other hosting services.
      </p>
    </div>
  )
}
