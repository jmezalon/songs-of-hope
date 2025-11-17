"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ContributionType } from "@prisma/client"

interface ContributionFormProps {
  type: ContributionType
  songId?: string
  onSuccess?: () => void
}

export function ContributionForm({ type, songId, onSuccess }: ContributionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/admin/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          songId,
          data: formData,
          notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit contribution")
      }

      // Success!
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/contributions")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const renderFormFields = () => {
    switch (type) {
      case "NEW_SONG":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Song Title</label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter song title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title (Kreyòl)</label>
              <Input
                value={formData.titleKreyol || ""}
                onChange={(e) => setFormData({ ...formData, titleKreyol: e.target.value })}
                placeholder="Enter Kreyòl title (optional)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lyrics</label>
              <Textarea
                value={formData.lyrics || ""}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                placeholder="Enter song lyrics"
                rows={10}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Author</label>
                <Input
                  value={formData.author || ""}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Lyricist name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Composer</label>
                <Input
                  value={formData.composer || ""}
                  onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                  placeholder="Music composer name"
                />
              </div>
            </div>
          </>
        )

      case "CORRECTION":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">What needs to be corrected?</label>
              <select
                value={formData.correctionType || ""}
                onChange={(e) => setFormData({ ...formData, correctionType: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select correction type</option>
                <option value="lyrics">Lyrics</option>
                <option value="metadata">Metadata (title, author, etc.)</option>
                <option value="translation">Translation</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current Text</label>
              <Textarea
                value={formData.currentText || ""}
                onChange={(e) => setFormData({ ...formData, currentText: e.target.value })}
                placeholder="Copy the current incorrect text"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Corrected Text</label>
              <Textarea
                value={formData.correctedText || ""}
                onChange={(e) => setFormData({ ...formData, correctedText: e.target.value })}
                placeholder="Enter the corrected text"
                rows={3}
                required
              />
            </div>
          </>
        )

      case "TRANSLATION":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Translation Language</label>
              <select
                value={formData.language || ""}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select language</option>
                <option value="KREYOL">Kreyòl</option>
                <option value="FRANCAIS">Français</option>
                <option value="ENGLISH">English</option>
                <option value="SPANISH">Spanish</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Translated Title</label>
              <Input
                value={formData.translatedTitle || ""}
                onChange={(e) => setFormData({ ...formData, translatedTitle: e.target.value })}
                placeholder="Enter translated title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Translated Lyrics</label>
              <Textarea
                value={formData.translatedLyrics || ""}
                onChange={(e) => setFormData({ ...formData, translatedLyrics: e.target.value })}
                placeholder="Enter translated lyrics"
                rows={10}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Translator Name</label>
              <Input
                value={formData.translator || ""}
                onChange={(e) => setFormData({ ...formData, translator: e.target.value })}
                placeholder="Your name or organization"
              />
            </div>
          </>
        )

      case "METADATA":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">What metadata would you like to update?</label>
              <Textarea
                value={formData.metadataChanges || ""}
                onChange={(e) => setFormData({ ...formData, metadataChanges: e.target.value })}
                placeholder="Describe the metadata changes (author, composer, year, etc.)"
                rows={5}
                required
              />
            </div>
          </>
        )

      case "MEDIA":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Media Type</label>
              <select
                value={formData.mediaType || ""}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select media type</option>
                <option value="SHEET_MUSIC">Sheet Music</option>
                <option value="AUDIO">Audio</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Media URL</label>
              <Input
                value={formData.mediaUrl || ""}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                placeholder="URL to the media file"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Media Title</label>
              <Input
                value={formData.mediaTitle || ""}
                onChange={(e) => setFormData({ ...formData, mediaTitle: e.target.value })}
                placeholder="Title for this media"
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  const getTitle = () => {
    switch (type) {
      case "NEW_SONG":
        return "Submit New Song"
      case "CORRECTION":
        return "Submit Correction"
      case "TRANSLATION":
        return "Submit Translation"
      case "METADATA":
        return "Update Metadata"
      case "MEDIA":
        return "Add Media"
      default:
        return "Submit Contribution"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>
          {songId
            ? "Your contribution will be reviewed by an admin before being published."
            : "Submit a new song for review."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information for the reviewer..."
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
