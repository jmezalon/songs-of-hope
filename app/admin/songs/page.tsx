import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function SongsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Songs</h1>
          <p className="text-muted-foreground">
            Manage all songs in the hymnal database
          </p>
        </div>
        <Link href="/admin/songs/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Songs</CardTitle>
          <CardDescription>
            Browse and manage the complete song collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Songs list will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
