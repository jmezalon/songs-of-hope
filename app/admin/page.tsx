import * as React from "react"
import Link from "next/link"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatDate } from "@/lib/utils"

// Mock data - will be replaced with actual database queries
const dashboardStats = {
  totalSongs: 1247,
  totalCollections: 2,
  songsByCollection: [
    { name: "Chant d'Espérance", count: 1089, percentage: 87 },
    { name: "Popular Christian Songs", count: 158, percentage: 13 },
  ],
  songsByLanguage: [
    { name: "Français", count: 612, percentage: 49 },
    { name: "Kreyòl", count: 477, percentage: 38 },
    { name: "Bilingual", count: 158, percentage: 13 },
  ],
  recentAdditions: [
    {
      id: "1",
      title: "Bon Dieu Nan Syèl La",
      titleKreyol: "Bon Dieu Nan Syèl La",
      section: "Mélodies Joyeuses",
      songNumber: 145,
      language: "Kreyòl",
      addedAt: new Date("2024-11-14T10:30:00"),
    },
    {
      id: "2",
      title: "Gloire à Dieu dans les Cieux",
      titleKreyol: null,
      section: "Chant d'Espérance",
      songNumber: 89,
      language: "Français",
      addedAt: new Date("2024-11-13T15:20:00"),
    },
    {
      id: "3",
      title: "Je Louerai l'Éternel",
      titleKreyol: "M'ap Lwanje Letènèl",
      section: "Échos des Élus",
      songNumber: 234,
      language: "Bilingual",
      addedAt: new Date("2024-11-12T09:15:00"),
    },
  ],
  pendingContributions: [
    {
      id: "1",
      type: "New Song",
      title: "Nou Bezwen Bondye",
      contributor: "Jean-Baptiste",
      submittedAt: new Date("2024-11-10T14:30:00"),
      status: "pending",
    },
    {
      id: "2",
      type: "Correction",
      title: "Chant d'Espérance #45 - Lyrics correction",
      contributor: "Marie Claire",
      submittedAt: new Date("2024-11-09T11:20:00"),
      status: "pending",
    },
    {
      id: "3",
      type: "Translation",
      title: "Amazing Grace - Kreyòl translation",
      contributor: "Pierre Laurent",
      submittedAt: new Date("2024-11-08T16:45:00"),
      status: "needs_revision",
    },
  ],
  weeklyStats: {
    songsAdded: 12,
    contributionsReceived: 8,
    usersActive: 24,
  },
}

const getLanguageBadgeColor = (language: string) => {
  switch (language) {
    case "Français":
      return "bg-blue-100 text-blue-700"
    case "Kreyòl":
      return "bg-green-100 text-green-700"
    case "Bilingual":
      return "bg-purple-100 text-purple-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const getContributionStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="warning">Pending Review</Badge>
    case "needs_revision":
      return <Badge variant="outline">Needs Revision</Badge>
    case "approved":
      return <Badge variant="success">Approved</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AdminDashboard() {
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
          <Button size="sm" asChild>
            <Link href="/admin/songs/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Song
            </Link>
          </Button>
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
            <div className="text-2xl font-bold">
              {formatNumber(dashboardStats.totalSongs)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">
                +{dashboardStats.weeklyStats.songsAdded}
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
            <div className="text-2xl font-bold">
              {dashboardStats.totalCollections}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.songsByCollection[0].count} in Chant d&apos;Espérance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Français, Kreyòl, Bilingual
            </p>
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
              {dashboardStats.weeklyStats.usersActive}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">
                +{dashboardStats.weeklyStats.contributionsReceived}
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
                      {song.section} #{song.songNumber}
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
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/admin/songs">View All Songs</Link>
            </Button>
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
              {dashboardStats.pendingContributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {contribution.type}
                      </Badge>
                      {getContributionStatusBadge(contribution.status)}
                    </div>
                    <p className="text-sm font-medium leading-none">
                      {contribution.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {contribution.contributor} •{" "}
                      {formatDate(contribution.submittedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/admin/users">Review Contributions</Link>
            </Button>
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
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/songs/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Song
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/collections">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Collections
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/themes">
                <CheckCircle className="mr-2 h-4 w-4" />
                Manage Themes
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/media">
                <TrendingUp className="mr-2 h-4 w-4" />
                Upload Media
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
