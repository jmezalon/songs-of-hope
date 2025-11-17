"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AddSongForm } from "@/components/forms/add-song-form"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export default function EditSongPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const songId = params.id as string

  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    // If the user cannot approve/publish (i.e. is not an admin), they should
    // not be able to edit songs directly. Route them to contributions instead.
    if (!session || session.user.role !== "ADMIN") {
      router.replace("/admin/contributions/new")
      return
    }

    async function fetchSong() {
      try {
        const response = await fetch(`/api/songs/${songId}`)
        if (!response.ok) throw new Error("Failed to fetch song")

        const data = await response.json()
        setSong(data.song)
      } catch (error) {
        console.error("Error fetching song:", error)
        toast.error("Failed to load song")
        router.push("/admin/songs")
      } finally {
        setLoading(false)
      }
    }

    if (songId) {
      fetchSong()
    }
  }, [songId, router, session, status])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading song...</div>
        </div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Song not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Song</h1>
        <p className="text-muted-foreground">Make changes to the song details</p>
      </div>

      <AddSongForm initialData={song} isEdit={true} />
    </div>
  )
}
