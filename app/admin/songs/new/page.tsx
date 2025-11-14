import { buttonVariants } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddSongForm } from "@/components/forms/add-song-form"

export default function NewSongPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/songs" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Song</h1>
          <p className="text-muted-foreground">
            Create a new song entry in the database
          </p>
        </div>
      </div>

      <AddSongForm />
    </div>
  )
}
