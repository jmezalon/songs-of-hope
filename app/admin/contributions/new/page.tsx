"use client"

import * as React from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ContributionForm } from "@/components/contributions/contribution-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContributionType } from "@prisma/client"
import { Music, FileEdit, Languages, Tag, FileAudio } from "lucide-react"

const contributionTypes = [
  {
    type: "NEW_SONG" as ContributionType,
    label: "New Song",
    description: "Submit a completely new song to be added to the collection",
    icon: Music,
  },
  {
    type: "CORRECTION" as ContributionType,
    label: "Correction",
    description: "Report and fix errors in existing song lyrics or metadata",
    icon: FileEdit,
  },
  {
    type: "TRANSLATION" as ContributionType,
    label: "Translation",
    description: "Provide a translation of a song in another language",
    icon: Languages,
  },
  {
    type: "METADATA" as ContributionType,
    label: "Metadata Update",
    description: "Update song information like author, composer, or year",
    icon: Tag,
  },
  {
    type: "MEDIA" as ContributionType,
    label: "Add Media",
    description: "Contribute sheet music, audio, or video for a song",
    icon: FileAudio,
  },
]

export default function NewContributionPage() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get("type") as ContributionType | null
  const songIdParam = searchParams.get("songId")

  const [selectedType, setSelectedType] = useState<ContributionType | null>(typeParam)

  if (!selectedType) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Submit a Contribution
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose the type of contribution you&apos;d like to make
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contributionTypes.map((contrib) => (
            <Card
              key={contrib.type}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-purple-300"
              onClick={() => setSelectedType(contrib.type)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <contrib.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">{contrib.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{contrib.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setSelectedType(null)}>
          ← Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {contributionTypes.find((c) => c.type === selectedType)?.label}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {contributionTypes.find((c) => c.type === selectedType)?.description}
          </p>
        </div>
      </div>

      <ContributionForm type={selectedType} songId={songIdParam || undefined} />
    </div>
  )
}
