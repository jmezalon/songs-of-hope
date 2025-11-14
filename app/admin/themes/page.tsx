import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ThemesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Themes & Tags</h1>
        <p className="text-muted-foreground">
          Manage song themes and categories
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Themes</CardTitle>
          <CardDescription>
            Categorize songs by occasions, seasons, and topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Themes management will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
