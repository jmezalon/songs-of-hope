import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collections & Sections</h1>
        <p className="text-muted-foreground">
          Manage hymnal collections and their sections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardDescription>
            Organize songs into collections and sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Collections management will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
