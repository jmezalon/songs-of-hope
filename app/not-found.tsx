import Link from "next/link"
import { Music, Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
            <Music className="w-12 h-12 text-purple-600" />
          </div>
        </div>

        {/* 404 */}
        <div>
          <h1 className="text-9xl font-bold text-purple-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin/songs">
              <Search className="mr-2 h-4 w-4" />
              Browse Songs
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  )
}
