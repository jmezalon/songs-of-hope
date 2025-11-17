import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import {
  Music,
  BookOpen,
  Languages,
  TrendingUp,
  Users,
  Plus,
  FileText,
  CheckCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatDate, cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { ContributionStatus, type ContributionType } from "@prisma/client"

type LanguageCode = "FRANCAIS" | "KREYOL" | "BILINGUAL" | "ENGLISH" | "SPANISH"

const languageLabels: Record<LanguageCode, string> = {
  FRANCAIS: "Français",
  KREYOL: "Kreyòl",
  BILINGUAL: "Bilingual",
  ENGLISH: "English",
  SPANISH: "Spanish",
}

const getLanguageBadgeColor = (language: string) => {
  const normalized = language.toUpperCase()
  switch (normalized) {
    case "FRANÇAIS":
    case "FRANCAIS":
      return "bg-blue-100 text-blue-700"
    case "KREYÒL":
    case "KREYOL":
      return "bg-green-100 text-green-700"
    case "BILINGUAL":
      return "bg-purple-100 text-purple-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const getContributionStatusBadge = (status: ContributionStatus) => {
  switch (status) {
    case ContributionStatus.PENDING:
      return <Badge variant="warning">Pending Review</Badge>
    case ContributionStatus.NEEDS_REVISION:
      return <Badge variant="outline">Needs Revision</Badge>
    case ContributionStatus.APPROVED:
      return <Badge variant="success">Approved</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
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

const extractContributionTitle = (data: unknown): string | undefined => {
  if (data && typeof data === "object" && "title" in data) {
    const maybeTitle = (data as { title?: unknown }).title
    if (typeof maybeTitle === "string" && maybeTitle.trim().length > 0) {
      return maybeTitle
    }
  }
  return undefined
}

const formatLanguageName = (code: string) =>
  languageLabels[code as LanguageCode] ?? code

export default async function AdminDashboard() {
  noStore()
  const now = new Date()
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(now.getDate() - 7)

  let dashboardStats: {
    totalSongs: number
    totalCollections: number
    songsByCollection: { name: string; count: number; percentage: number }[]
    songsByLanguage: { name: string; count: number; percentage: number }[]
    recentAdditions: {
      id: string
      title: string
      section: string
      songNumber: number | null
      language: string
      addedAt: Date
    }[]
    pendingContributions: {
      id: string
      type: ContributionType
      status: ContributionStatus
      title: string
      contributor: string
      submittedAt: Date
    }[]
    weeklyStats: {
      songsAdded: number
      contributionsReceived: number
      usersActive: number
    }
  }

  try {
  const [
    totalSongs,
    totalCollections,
    languageCounts,
    recentSongs,
    pendingContributionRecords,
    songsAddedThisWeek,
    contributionsThisWeek,
    activeContributors,
    hymnalSongCount,
  ] = await Promise.all([
    prisma.song.count(),
    prisma.collection.count(),
    prisma.song.groupBy({
      by: ["language"],
      _count: { language: true },
    }),
      prisma.song.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          songNumber: true,
          language: true,
          createdAt: true,
          section: { select: { name: true } },
        },
      }),
      prisma.contribution.findMany({
        where: {
          status: {
            in: [ContributionStatus.PENDING, ContributionStatus.NEEDS_REVISION],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          type: true,
          status: true,
          data: true,
          createdAt: true,
          song: { select: { title: true, songNumber: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.song.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.contribution.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.user.count({
      where: {
        contributions: {
          some: { createdAt: { gte: oneWeekAgo } },
        },
      },
    }),
    prisma.song.count({
      where: {
        sectionId: { not: null },
      },
    }),
  ])

  const popularSongCount = totalSongs - hymnalSongCount

  const songsByCollection = [
    {
      name: "Hymnal Songs",
      count: hymnalSongCount,
      percentage: totalSongs > 0 ? Math.round((hymnalSongCount / totalSongs) * 100) : 0,
    },
    {
      name: "Popular Songs",
      count: popularSongCount,
      percentage: totalSongs > 0 ? Math.round((popularSongCount / totalSongs) * 100) : 0,
    },
  ]

    const songsByLanguage = languageCounts.map((entry) => {
      const count = entry._count.language
      return {
        name: formatLanguageName(entry.language),
        count,
        percentage: totalSongs > 0 ? Math.round((count / totalSongs) * 100) : 0,
      }
    })

    const recentAdditions = recentSongs.map((song) => ({
      id: song.id,
      title: song.title,
      section: song.section?.name || "Uncategorized",
      songNumber: song.songNumber,
      language: formatLanguageName(song.language),
      addedAt: song.createdAt,
    }))

    const pendingContributions = pendingContributionRecords.map((contribution) => ({
      id: contribution.id,
      type: contribution.type,
      status: contribution.status,
      title:
        contribution.song?.title ||
        extractContributionTitle(contribution.data) ||
        getContributionTypeLabel(contribution.type),
      contributor:
        contribution.user?.name || contribution.user?.email || "Contributor",
      submittedAt: contribution.createdAt,
    }))

    dashboardStats = {
      totalSongs,
      totalCollections,
      songsByCollection,
      songsByLanguage,
      recentAdditions,
      pendingContributions,
      weeklyStats: {
        songsAdded: songsAddedThisWeek,
        contributionsReceived: contributionsThisWeek,
        usersActive: activeContributors,
      },
    }
  } catch (error) {
    console.error("Failed to load dashboard stats:", error)
    dashboardStats = {
      totalSongs: 0,
      totalCollections: 0,
      songsByCollection: [],
      songsByLanguage: [],
      recentAdditions: [],
      pendingContributions: [],
      weeklyStats: {
        songsAdded: 0,
        contributionsReceived: 0,
        usersActive: 0,
      },
    }
  }

  const languagesSummary =
    dashboardStats.songsByLanguage.map((lang) => lang.name).join(", ") ||
    "No songs yet"

  const topCollection = dashboardStats.songsByCollection[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your hymnal platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Link href="/admin/songs/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Song
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardStats.totalSongs)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">
                +{formatNumber(dashboardStats.weeklyStats.songsAdded)}
              </span>{" "}
              this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardStats.totalCollections)}</div>
            <p className="text-xs text-muted-foreground">
              {topCollection
                ? `${formatNumber(topCollection.count)} in ${topCollection.name}`
                : "No collections yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.songsByLanguage.length}
            </div>
            <p className="text-xs text-muted-foreground">{languagesSummary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Contributors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardStats.weeklyStats.usersActive)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">
                +{formatNumber(dashboardStats.weeklyStats.contributionsReceived)}
              </span>{" "}
              contributions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Songs by Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Songs by Collection</CardTitle>
            <CardDescription>
              Distribution across different hymnals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardStats.songsByCollection.length === 0 && (
              <p className="text-sm text-muted-foreground">No songs recorded yet.</p>
            )}
            {dashboardStats.songsByCollection.map((collection) => (
              <div key={collection.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{collection.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(collection.count)} ({collection.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    style={{ width: `${collection.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Songs by Language */}
        <Card>
          <CardHeader>
            <CardTitle>Songs by Language</CardTitle>
            <CardDescription>Language distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardStats.songsByLanguage.length === 0 && (
              <p className="text-sm text-muted-foreground">No language data yet.</p>
            )}
            {dashboardStats.songsByLanguage.map((language) => (
              <div key={language.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(language.count)} ({language.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                    style={{ width: `${language.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Additions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Additions</CardTitle>
            <CardDescription>Latest songs added to the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.recentAdditions.length === 0 && (
                <p className="text-sm text-muted-foreground">No songs added yet.</p>
              )}
              {dashboardStats.recentAdditions.map((song) => (
                <div
                  key={song.id}
                  className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {song.section} {song.songNumber ? `#${song.songNumber}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(song.addedAt)}
                    </p>
                  </div>
                  <Badge
                    className={getLanguageBadgeColor(song.language)}
                    variant="outline"
                  >
                    {song.language}
                  </Badge>
                </div>
              ))}
            </div>
            <Link
              href="/admin/songs"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full")}
            >
              View All Songs
            </Link>
          </CardContent>
        </Card>

        {/* Pending Contributions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Contributions</CardTitle>
            <CardDescription>
              User submissions awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.pendingContributions.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending submissions.</p>
              )}
              {dashboardStats.pendingContributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getContributionTypeLabel(contribution.type)}
                      </Badge>
                      {getContributionStatusBadge(contribution.status)}
                    </div>
                    <p className="text-sm font-medium leading-none">
                      {contribution.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {contribution.contributor} • {formatDate(contribution.submittedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/admin/contributions"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full")}
            >
              Review Contributions
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/songs/new"
              className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Song
            </Link>
            <Link
              href="/admin/collections"
              className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Collections
            </Link>
            <Link
              href="/admin/themes"
              className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Manage Themes
            </Link>
            <Link
              href="/admin/media"
              className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Upload Media
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
