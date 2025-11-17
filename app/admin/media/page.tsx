"use client"

import * as React from "react"
import { Play, FileText, Video, Music as MusicIcon, Trash2, ExternalLink, Filter, Download } from "lucide-react"
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
import Link from "next/link"

interface Media {
  id: string
  songId: string
  type: "SHEET_MUSIC" | "AUDIO" | "VIDEO" | "IMAGE"
  title: string | null
  url: string
  thumbnailUrl: string | null
  fileSize: number | null
  duration: number | null
  mimeType: string | null
  isPublic: boolean
  createdAt: string
  song: {
    id: string
    title: string
    songNumber: number | null
  }
  uploader: {
    name: string | null
    email: string
  } | null
}

const MEDIA_TYPES = [
  { value: "SHEET_MUSIC", label: "Sheet Music", icon: FileText, color: "bg-blue-100 text-blue-800" },
  { value: "AUDIO", label: "Audio", icon: MusicIcon, color: "bg-green-100 text-green-800" },
  { value: "VIDEO", label: "Video", icon: Video, color: "bg-purple-100 text-purple-800" },
  { value: "IMAGE", label: "Image", icon: Play, color: "bg-yellow-100 text-yellow-800" },
]

export default function MediaPage() {
  const [media, setMedia] = React.useState<Media[]>([])
  const [loading, setLoading] = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState<string>("")

  React.useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch("/api/media")
      if (!response.ok) {
        // If the endpoint doesn't exist yet, use mock data
        if (response.status === 404) {
          setMedia([])
          return
        }
        throw new Error("Failed to fetch media")
      }
      const data = await response.json()
      setMedia(data.media)
    } catch (error) {
      console.error("Error fetching media:", error)
      toast.error("Failed to load media")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media file?")) {
      return
    }

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete media")

      toast.success("Media deleted successfully")
      fetchMedia()
    } catch (error) {
      console.error("Error deleting media:", error)
      toast.error("Failed to delete media")
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMediaIcon = (type: string) => {
    const mediaType = MEDIA_TYPES.find((t) => t.value === type)
    const Icon = mediaType?.icon || FileText
    return <Icon className="h-4 w-4" />
  }

  const getMediaBadgeColor = (type: string) => {
    return MEDIA_TYPES.find((t) => t.value === type)?.color || "bg-gray-100 text-gray-800"
  }

  const filteredMedia = typeFilter
    ? media.filter((m) => m.type === typeFilter)
    : media

  const mediaStats = MEDIA_TYPES.map((type) => ({
    ...type,
    count: media.filter((m) => m.type === type.value).length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          Manage sheet music, audio, and video files
        </p>
      </div>

      {/* Media Type Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mediaStats.map((type) => {
          const Icon = type.icon
          return (
            <Card
              key={type.value}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setTypeFilter(typeFilter === type.value ? "" : type.value)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-medium">{type.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{type.count}</div>
                <p className="text-xs text-muted-foreground">
                  file{type.count !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Media List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Media</CardTitle>
              <CardDescription>
                {typeFilter
                  ? `${filteredMedia.length} ${MEDIA_TYPES.find(t => t.value === typeFilter)?.label} files`
                  : `${media.length} total files`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {typeFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTypeFilter("")}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Song</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedia.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge className={getMediaBadgeColor(item.type)}>
                            {getMediaIcon(item.type)}
                            <span className="ml-1">
                              {MEDIA_TYPES.find(t => t.value === item.type)?.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/songs/${item.songId}/edit`}
                            className="hover:underline text-primary"
                          >
                            {item.song.songNumber && `#${item.song.songNumber} - `}
                            {item.song.title}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.title || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatFileSize(item.fileSize)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDuration(item.duration)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(item.url, "_blank")}
                              title="Open file"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-500"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredMedia.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {typeFilter
                            ? `No ${MEDIA_TYPES.find(t => t.value === typeFilter)?.label.toLowerCase()} files yet.`
                            : `No media files yet. Media can be added when creating or editing songs.`}
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

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Media Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Media files are attached to songs through the song editor. This page provides a centralized view of all media files in the system.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Sheet Music:</strong> PDF files of musical notation</li>
            <li><strong>Audio:</strong> MP3, WAV, or other audio recordings</li>
            <li><strong>Video:</strong> YouTube links or video files</li>
            <li><strong>Images:</strong> Album covers, photos, or illustrations</li>
          </ul>
          <p className="mt-4">
            To add media to a song, edit the song and use the Media Manager in the song form.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
