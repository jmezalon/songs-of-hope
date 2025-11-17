 "use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Filter,
  Download,
  Trash2,
  Eye,
  Edit,
  Copy,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { SearchBar } from "@/components/search/search-bar"
import { SongTableSkeleton } from "@/components/ui/table-skeleton"
import { useSession } from "next-auth/react"

// Types
interface Song {
  id: string
  songNumber: number | null
  title: string
  titleKreyol: string | null
  language: "FRANCAIS" | "KREYOL" | "BILINGUAL" | "ENGLISH" | "SPANISH"
  author: string | null
  composer: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  viewCount: number
  collection: {
    name: string
  }
  section: {
    name: string
  } | null
  createdAt: string
}

interface SongsResponse {
  songs: Song[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SongsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const canManageSongs = session?.user.role === "ADMIN"
  const canViewSongs = session?.user.role === "ADMIN" || session?.user.role === "CONTRIBUTOR"
  const [data, setData] = React.useState<Song[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [sectionFilter, setSectionFilter] = React.useState("")
  const [languageFilter, setLanguageFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [showFilters, setShowFilters] = React.useState(false)

  // Fetch songs
  const fetchSongs = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (statusFilter) params.append("status", statusFilter)
      if (sectionFilter) params.append("sectionId", sectionFilter)
      if (languageFilter) params.append("language", languageFilter)

      const response = await fetch(`/api/songs?${params}`)
      if (!response.ok) throw new Error("Failed to fetch songs")

      const result: SongsResponse = await response.json()
      setData(result.songs)
      setPagination(result.pagination)
    } catch (error) {
      console.error("Error fetching songs:", error)
      toast.error("Failed to load songs")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, sectionFilter, languageFilter])

  React.useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.replace("/login")
      return
    }

    if (!canViewSongs) {
      router.replace("/admin/contributions/new")
      return
    }

    fetchSongs()
  }, [fetchSongs, router, session, status, canViewSongs])

  // Bulk actions
  const handleBulkPublish = async () => {
    if (!canManageSongs) return
    const selectedIds = Object.keys(rowSelection)
    if (selectedIds.length === 0) {
      toast.error("No songs selected")
      return
    }

    try {
      const promises = selectedIds.map((id) =>
        fetch(`/api/songs/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PUBLISHED" }),
        })
      )

      await Promise.all(promises)
      toast.success(`Successfully published ${selectedIds.length} song(s)`)
      setRowSelection({})
      fetchSongs()
    } catch (error) {
      console.error("Error bulk publishing:", error)
      toast.error("Failed to publish songs")
    }
  }

  const handleBulkDelete = async () => {
    if (!canManageSongs) return
    const selectedIds = Object.keys(rowSelection)
    if (selectedIds.length === 0) {
      toast.error("No songs selected")
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} song(s)?`)) {
      return
    }

    try {
      const promises = selectedIds.map((id) =>
        fetch(`/api/songs/${id}`, {
          method: "DELETE",
        })
      )

      await Promise.all(promises)
      toast.success(`Successfully deleted ${selectedIds.length} song(s)`)
      setRowSelection({})
      fetchSongs()
    } catch (error) {
      console.error("Error bulk deleting:", error)
      toast.error("Failed to delete songs")
    }
  }

  const handleExportCSV = () => {
    const selectedIds = Object.keys(rowSelection)
    const songsToExport = selectedIds.length > 0
      ? data.filter((song) => selectedIds.includes(song.id))
      : data

    // Create CSV content
    const headers = ["Number", "Title", "Collection", "Section", "Language", "Author", "Composer", "Status", "Views"]
    const rows = songsToExport.map((song) => [
      song.songNumber || "",
      song.title,
      song.collection.name,
      song.section?.name || "",
      song.language,
      song.author || "",
      song.composer || "",
      song.status,
      song.viewCount,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `songs-export-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`Exported ${songsToExport.length} song(s) to CSV`)
  }

  // Quick actions
  const handleToggleStatus = async (songId: string, currentStatus: string) => {
    if (!canManageSongs) return
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED"

    try {
      // First, fetch the full song data
      const getSongResponse = await fetch(`/api/songs/${songId}`)
      if (!getSongResponse.ok) throw new Error("Failed to fetch song")

      const { song } = await getSongResponse.json()

      // Update with the new status
      const response = await fetch(`/api/songs/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...song,
          status: newStatus,
        }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast.success(`Status changed to ${newStatus}`)
      fetchSongs()
    } catch (error) {
      console.error("Error toggling status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleDuplicate = async (songId: string) => {
    if (!canManageSongs) return
    try {
      // Fetch the full song data
      const response = await fetch(`/api/songs/${songId}`)
      if (!response.ok) throw new Error("Failed to fetch song")

      const { song } = await response.json()

      // Determine song type based on whether it has a section
      const songType = song.section ? "hymnal" : "popular"

      // Format verses data
      const verses = song.verses?.map((verse: any) => ({
        id: crypto.randomUUID(),
        type: verse.type,
        verseNumber: verse.verseNumber,
        label: verse.label,
        labelKreyol: verse.labelKreyol,
        sortOrder: verse.sortOrder,
        isRepeated: verse.isRepeated,
        lines: verse.lines?.map((line: any) => ({
          id: crypto.randomUUID(),
          text: line.text,
          textKreyol: line.textKreyol,
          lineNumber: line.lineNumber,
          isIndented: line.isIndented,
          indent: line.indent,
        })) || [],
      })) || []

      // Format theme IDs
      const themeIds = song.themes?.map((t: any) => t.theme.id) || []

      // Format biblical references
      const biblicalReferences = song.biblicalRefs?.map((ref: any) => ({
        id: crypto.randomUUID(),
        book: ref.biblicalReference.book,
        chapter: ref.biblicalReference.chapter,
        verseStart: ref.biblicalReference.verseStart,
        verseEnd: ref.biblicalReference.verseEnd,
      })) || []

      // Format media
      const media = song.media?.map((m: any) => ({
        id: crypto.randomUUID(),
        type: m.type,
        url: m.url,
        title: m.title,
      })) || []

      // Create a duplicate with only the fields expected by the API
      const duplicateData = {
        songType,
        sectionId: song.sectionId,
        songNumber: undefined, // Remove to avoid conflicts
        language: song.language,
        title: `${song.title} (Copy)`,
        titleKreyol: song.titleKreyol ? `${song.titleKreyol} (Kopi)` : undefined,
        subtitle: song.subtitle,
        subtitleKreyol: song.subtitleKreyol,
        companionSongId: undefined,
        tune: song.tune,
        meter: song.meter,
        musicalKey: song.musicalKey,
        timeSignature: song.timeSignature,
        tempo: song.tempo,
        author: song.author,
        authorKreyol: song.authorKreyol,
        composer: song.composer,
        translator: song.translator,
        arranger: song.arranger,
        yearWritten: song.yearWritten,
        copyrightStatus: song.copyrightStatus,
        copyrightInfo: song.copyrightInfo,
        firstLine: song.firstLine,
        firstLineKreyol: song.firstLineKreyol,
        summary: song.summary,
        notes: song.notes,
        status: "DRAFT",
        verses,
        themeIds,
        biblicalReferences,
        media,
      }

      const createResponse = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || "Failed to duplicate song")
      }

      toast.success("Song duplicated successfully")
      fetchSongs()
    } catch (error) {
      console.error("Error duplicating song:", error)
      toast.error(error instanceof Error ? error.message : "Failed to duplicate song")
    }
  }

  const handleDelete = async (songId: string) => {
    if (!canManageSongs) return
    if (!confirm("Are you sure you want to delete this song?")) {
      return
    }

    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete song")

      toast.success("Song deleted successfully")
      fetchSongs()
    } catch (error) {
      console.error("Error deleting song:", error)
      toast.error("Failed to delete song")
    }
  }

  // Column definitions
  const columns: ColumnDef<Song>[] = [
    ...(canManageSongs
      ? [
          {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onChange={(e) => row.toggleSelected(!!e.target.checked)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
            enableHiding: false,
          },
        ]
      : []),
    {
      accessorKey: "songNumber",
      header: "#",
      cell: ({ row }) => {
        const number = row.getValue("songNumber") as number | null
        return number ? <span className="font-mono">{number}</span> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        const titleKreyol = row.original.titleKreyol
        return (
          <div className="max-w-[300px]">
            <div className="font-medium truncate">{title}</div>
            {titleKreyol && <div className="text-sm text-muted-foreground truncate">{titleKreyol}</div>}
          </div>
        )
      },
    },
    {
      id: "collection",
      accessorFn: (row) => row.collection.name,
      header: "Collection",
      cell: ({ row }) => {
        return <span className="text-sm">{row.original.collection.name}</span>
      },
    },
    {
      id: "section",
      accessorFn: (row) => row.section?.name,
      header: "Section",
      cell: ({ row }) => {
        const section = row.original.section
        return section ? (
          <span className="text-sm">{section.name}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => {
        const language = row.getValue("language") as string
        const variant = language === "BILINGUAL" ? "default" : language === "FRANCAIS" ? "secondary" : "outline"
        return <Badge variant={variant}>{language}</Badge>
      },
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => {
        const author = row.getValue("author") as string | null
        return author ? <span className="text-sm">{author}</span> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variant =
          status === "PUBLISHED" ? "default" : status === "DRAFT" ? "secondary" : "outline"
        return (
          <Badge
            variant={variant}
            className={canManageSongs ? "cursor-pointer" : ""}
            onClick={
              canManageSongs ? () => handleToggleStatus(row.original.id, status) : undefined
            }
          >
            {status === "PUBLISHED" && <CheckCircle2 className="mr-1 h-3 w-3" />}
            {status === "DRAFT" && <Circle className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "viewCount",
      header: "Views",
      cell: ({ row }) => {
        const views = row.getValue("viewCount") as number
        return <span className="font-mono text-sm">{views.toLocaleString()}</span>
      },
    },
    ...(canManageSongs
      ? [
          {
            id: "actions",
            cell: ({ row }) => {
              const song = row.original
              return (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info("Quick view coming soon...")}
                    title="Quick view"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Link href={`/admin/songs/${song.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(song.id)}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(song.id)}
                    title="Delete"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            },
          },
        ]
      : []),
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: canManageSongs,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Songs</h1>
          <p className="text-muted-foreground">Manage all songs in the hymnal database</p>
        </div>
        {canManageSongs && (
          <Link href="/admin/songs/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Song
          </Link>
        )}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Songs</CardTitle>
              <CardDescription>{pagination.total} total songs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar with Autocomplete */}
          <SearchBar
            onSelect={
              canManageSongs ? (songId) => router.push(`/admin/songs/${songId}/edit`) : undefined
            }
            placeholder="Search songs by title, lyrics, author, or number..."
            adminMode={!!canManageSongs}
            className="w-full"
          />

          {/* Additional Filters */}
          {showFilters && (
            <div className="grid gap-4 md:grid-cols-3">


              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Languages</option>
                <option value="FRANCAIS">Français</option>
                <option value="KREYOL">Kreyòl</option>
                <option value="BILINGUAL">Bilingual</option>
                <option value="ENGLISH">English</option>
                <option value="SPANISH">Spanish</option>
              </select>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Sections</option>
                {/* TODO: Populate from API */}
              </select>
            </div>
          )}

          {/* Bulk Actions */}
          {canManageSongs && Object.keys(rowSelection).length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <span className="text-sm font-medium">{Object.keys(rowSelection).length} selected</span>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <Button variant="outline" size="sm" onClick={handleBulkPublish}>
                  <CheckCircle2 className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Publish</span>
                  <span className="sm:hidden">Pub</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Exp</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-500">
                  <Trash2 className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <SongTableSkeleton rows={10} />
              ) : (
                <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No songs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {data.length} of {pagination.total} songs
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.totalPages }))}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
