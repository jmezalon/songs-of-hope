 "use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ContributionForm } from "@/components/contributions/contribution-form"
import { ContributionType } from "@prisma/client"

interface ApiContribution {
  id: string
  type: ContributionType
  songId?: string | null
  data: Record<string, unknown>
  notes?: string | null
}

export default function EditContributionPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contribution, setContribution] = useState<ApiContribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchContribution = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/contributions/${id}`)
        if (!res.ok) {
          throw new Error("Failed to load contribution")
        }
        const data = await res.json()
        setContribution(data)
      } catch (err) {
        console.error("Error loading contribution:", err)
        setError("Unable to load contribution for editing.")
      } finally {
        setLoading(false)
      }
    }

    fetchContribution()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading contribution...</div>
        </div>
      </div>
    )
  }

  if (error || !contribution) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">
            {error || "Contribution not found"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Edit Contribution
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your contribution based on reviewer feedback.
        </p>
      </div>

      <ContributionForm
        type={contribution.type}
        songId={contribution.songId ?? undefined}
        initialData={contribution.data as Record<string, string | number | null | undefined>}
        initialNotes={contribution.notes ?? undefined}
        contributionId={contribution.id}
        onSuccess={() => router.push("/admin/contributions/my")}
      />
    </div>
  )
}
