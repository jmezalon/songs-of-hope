 "use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ContributionStatus, ContributionType } from "@prisma/client"

interface Contribution {
  id: string
  type: ContributionType
  status: ContributionStatus
  notes?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  song?: {
    id: string
    title: string
    songNumber?: number
  } | null
}

export default function MyContributionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.replace("/login")
      return
    }

    const fetchMine = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/admin/contributions")
        if (!res.ok) throw new Error("Failed to load contributions")
        const data = await res.json()
        setContributions(data.contributions || [])
      } catch (error) {
        console.error("Error loading contributions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMine()
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
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

  const getTypeLabel = (type: ContributionType) => {
    const labels: Record<ContributionType, string> = {
      NEW_SONG: "New Song",
      CORRECTION: "Correction",
      TRANSLATION: "Translation",
      METADATA: "Metadata",
      MEDIA: "Media",
    }
    return labels[type]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          My Contributions
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the review status of your song submissions and updates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contributions</CardTitle>
          <CardDescription>
            These are contributions submitted from your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              Loading your contributions...
            </div>
          ) : contributions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              You have not submitted any contributions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Review Notes</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{getTypeLabel(c.type)}</TableCell>
                    <TableCell>
                      {c.song ? (
                        <div>
                          <div className="text-sm font-medium">{c.song.title}</div>
                          {c.song.songNumber && (
                            <div className="text-xs text-gray-500">#{c.song.songNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">New song</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(new Date(c.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {c.reviewedAt ? formatDate(new Date(c.reviewedAt)) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 max-w-xs">
                      {c.reviewNotes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {c.status === "NEEDS_REVISION" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/contributions/${c.id}/edit`)}
                          >
                            Edit & Resubmit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={async () => {
                            if (!window.confirm("Are you sure you want to delete this contribution?")) {
                              return
                            }
                            try {
                              const res = await fetch(`/api/admin/contributions/${c.id}`, {
                                method: "DELETE",
                              })
                              if (!res.ok) {
                                throw new Error("Failed to delete contribution")
                              }
                              setContributions((prev) => prev.filter((item) => item.id !== c.id))
                            } catch (err) {
                              console.error("Failed to delete contribution:", err)
                              alert("Failed to delete contribution. Please try again.")
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


