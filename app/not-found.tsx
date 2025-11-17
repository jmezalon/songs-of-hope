import Link from "next/link"
import { Music, Home, Search } from "lucide-react"

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
          <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 px-8 bg-primary text-primary-foreground shadow hover:bg-primary/90">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
          <Link href="/admin/songs" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 px-8 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
            <Search className="mr-2 h-4 w-4" />
            Browse Songs
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  )
}
