 "use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Music,
  Languages,
  MessageSquare,
  Loader2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { ContributionStatus, ContributionType } from "@prisma/client"
import type { SongFormValues, LyricVerse } from "@/lib/validations/song"

interface ContributionData {
  // Shape varies by contribution type; keep flexible here
  [key: string]: unknown
}

interface Contribution {
  id: string
  type: ContributionType
  status: ContributionStatus
  data: ContributionData
  notes?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  song?: {
    id: string
    title: string
    titleKreyol?: string
    songNumber?: number
  }
}

interface SectionLookup {
  id: string
  name: string
  nameKreyol: string | null
}

const getContributionTypeLabel = (type: ContributionType) => {
  const labels: Record<ContributionType, string> = {
    NEW_SONG: "New Song",
    CORRECTION: "Correction",
    TRANSLATION: "Translation",
    METADATA: "Metadata",
    MEDIA: "Media",
  }
  return labels[type]
}

const getContributionTypeIcon = (type: ContributionType) => {
  switch (type) {
    case "NEW_SONG":
      return <Music className="h-4 w-4" />
    case "TRANSLATION":
      return <Languages className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const isSongContribution = (data: ContributionData): data is SongFormValues => {
  if (!data || typeof data !== "object") return false
  return "title" in data && "songType" in data && "language" in data
}

const VersePreview = ({ verse }: { verse: LyricVerse }) => {
  return (
    <div className="rounded-md border bg-white px-3 py-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-700">{verse.label || verse.type}</span>
        {verse.verseNumber && <span>#{verse.verseNumber}</span>}
      </div>
      {verse.lines && verse.lines.length > 0 ? (
        <div className="space-y-1">
          {verse.lines.map((line) => (
            <div key={line.id} className="text-sm text-gray-900">
              {line.text}
              {line.textKreyol && (
                <div className="text-xs text-gray-500">{line.textKreyol}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No lines provided</p>
      )}
    </div>
  )
}

const DetailItem = ({ label, value }: { label: string; value?: React.ReactNode }) => {
  if (!value) return null
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  )
}

const getStatusBadge = (status: ContributionStatus) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning">Pending Review</Badge>
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>
    case "NEEDS_REVISION":
      return <Badge variant="outline">Needs Revision</Badge>
  }
}

export default function ContributionsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ContributionStatus | "ALL">("ALL")
  const [typeFilter, setTypeFilter] = useState<ContributionType | "ALL">("ALL")
  const [sections, setSections] = useState<SectionLookup[]>([])

  const fetchContributions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter)
      }
      if (typeFilter !== "ALL") {
        params.set("type", typeFilter)
      }

      const response = await fetch(`/api/admin/contributions?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch contributions")

      const data = await response.json()
      setContributions(data.contributions)
    } catch (error) {
      console.error("Error fetching contributions:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    if (status === "loading") return

    // Only admins can review and approve contributions. Contributors should not
    // see the review dashboard at all.
    if (!session || session.user.role !== "ADMIN") {
      router.replace("/admin/contributions/new")
      return
    }

    fetchContributions()
  }, [statusFilter, typeFilter, session, status, router, fetchContributions])

  useEffect(() => {
    async function loadSections() {
      try {
        const response = await fetch("/api/sections")
        if (!response.ok) return
        const data = await response.json()
        setSections(
          data.sections?.map((section: SectionLookup) => ({
            id: section.id,
            name: section.name,
            nameKreyol: section.nameKreyol ?? null,
          })) ?? []
        )
      } catch (error) {
        console.error("Failed to load sections", error)
      }
    }
    loadSections()
  }, [])

  const handleAction = async (contributionId: string, status: ContributionStatus) => {
    try {
      setActionLoading(true)

      const response = await fetch(`/api/admin/contributions/${contributionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to update contribution")

      const result: { songId?: string | null } = await response.json()

      // Refresh contributions list
      await fetchContributions()
      setSelectedContribution(null)
      setReviewNotes("")

      // If a song was created/updated and this was an approval, offer to go to it.
      if (status === "APPROVED" && result.songId) {
        // router.push(`/admin/songs/${result.songId}/edit`)
        router.push("/admin/songs")
      }
    } catch (error) {
      console.error("Error updating contribution:", error)
      alert("Failed to update contribution. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  const pendingCount = contributions.filter((c) => c.status === "PENDING").length
  const needsRevisionCount = contributions.filter((c) => c.status === "NEEDS_REVISION").length

  const songSubmission =
    selectedContribution?.type === "NEW_SONG" && isSongContribution(selectedContribution.data)
      ? selectedContribution.data
      : null
  const selectedSectionName = songSubmission
    ? getSectionName(sections, songSubmission.sectionId || undefined)
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Contributions Review
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage user submissions for songs, corrections, and translations
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting admin action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{needsRevisionCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting contributor update
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contributions.length}</div>
              <p className="text-xs text-muted-foreground">
                All time submissions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter((e.target.value as ContributionStatus | "ALL") ?? "ALL")
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="NEEDS_REVISION">Needs Revision</option>
              </select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium">Type</label>
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter((e.target.value as ContributionType | "ALL") ?? "ALL")
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="NEW_SONG">New Song</option>
                <option value="CORRECTION">Correction</option>
                <option value="TRANSLATION">Translation</option>
                <option value="METADATA">Metadata</option>
                <option value="MEDIA">Media</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contributions</CardTitle>
          <CardDescription>
            Click on a contribution to review and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No contributions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Contributor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getContributionTypeIcon(contribution.type)}
                        <span className="text-sm font-medium">
                          {getContributionTypeLabel(contribution.type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contribution.song ? (
                        <div>
                          <div className="text-sm font-medium">
                            {contribution.song.title}
                          </div>
                          {contribution.song.songNumber && (
                            <div className="text-xs text-gray-500">
                              #{contribution.song.songNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">New song</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">
                          {contribution.user.name || "Anonymous"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contribution.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contribution.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(new Date(contribution.createdAt))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedContribution(contribution)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Contribution</CardTitle>
              <CardDescription>
                {getContributionTypeLabel(selectedContribution.type)} by{" "}
                {selectedContribution.user.name || selectedContribution.user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contribution Details */}
              <div className="space-y-2">
                <h3 className="font-semibold">Submission Details</h3>
                {songSubmission ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-white p-4 space-y-3">
                      <div className="flex flex-wrap gap-4">
                        <DetailItem label="Title" value={songSubmission.title} />
                        <DetailItem label="Language" value={songSubmission.language} />
                        <DetailItem label="Song Type" value={songSubmission.songType} />
                        <DetailItem
                          label="Status"
                          value={
                            <Badge variant="outline">
                              {songSubmission.status || "PENDING_REVIEW"}
                            </Badge>
                          }
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <DetailItem label="Section" value={selectedSectionName || "—"} />
                        <DetailItem label="Song Number" value={songSubmission.songNumber || "—"} />
                        <DetailItem label="Author" value={songSubmission.author} />
                        <DetailItem label="Composer" value={songSubmission.composer} />
                      </div>
                    </div>

                    {songSubmission.summary && (
                      <div className="rounded-lg border bg-white p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                        <p className="text-sm text-gray-800">{songSubmission.summary}</p>
                      </div>
                    )}

                    {songSubmission.verses && songSubmission.verses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Lyrics Preview</h4>
                        <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                          {songSubmission.verses.map((verse) => (
                            <VersePreview key={verse.id} verse={verse} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border bg-white p-4 grid gap-4 md:grid-cols-2">
                      <DetailItem label="Translator" value={songSubmission.translator} />
                      <DetailItem label="Arranger" value={songSubmission.arranger} />
                      <DetailItem label="Year Written" value={songSubmission.yearWritten} />
                      <DetailItem label="Difficulty" value={songSubmission.difficulty} />
                    </div>

                    {(songSubmission.media?.length || 0) > 0 && (
                      <div className="rounded-lg border bg-white p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Media</h4>
                        <div className="space-y-1 text-sm">
                          {songSubmission.media?.map((media) => (
                            <div key={media.id} className="flex items-center justify-between">
                              <span>{media.title || media.type}</span>
                              <a
                                href={media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 text-xs"
                              >
                                Open
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedContribution.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Contributor Notes */}
              {selectedContribution.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Contributor Notes</h3>
                  <p className="text-sm text-gray-700">{selectedContribution.notes}</p>
                </div>
              )}

              {/* Review Notes */}
              <div className="space-y-2">
                <label className="font-semibold">Review Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your review decision..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAction(selectedContribution.id, "APPROVED")}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={() => handleAction(selectedContribution.id, "NEEDS_REVISION")}
                  disabled={actionLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Request Revision
                </Button>
                <Button
                  onClick={() => handleAction(selectedContribution.id, "REJECTED")}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>
              </div>

              <Button
                onClick={() => {
                  setSelectedContribution(null)
                  setReviewNotes("")
                }}
                variant="ghost"
                className="w-full"
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
const getSectionName = (sections: SectionLookup[], sectionId?: string | null) => {
  if (!sectionId) return undefined
  const match = sections.find((section) => section.id === sectionId)
  if (!match) return sectionId
  return match.name || sectionId
}
