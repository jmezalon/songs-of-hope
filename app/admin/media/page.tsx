import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          Manage sheet music, audio, and video files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Files</CardTitle>
          <CardDescription>
            Upload and organize media resources for songs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Media library will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
