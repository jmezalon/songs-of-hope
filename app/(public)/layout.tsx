"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Music, Search, BookOpen, Heart, List, LogIn, User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { MobileMenu } from "@/components/navigation/mobile-menu";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Chant d'Espérance</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </Link>
              {user && (
                <>
                  <Link href="/favorites">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Favorites
                    </Button>
                  </Link>
                  <Link href="/playlists">
                    <Button variant="ghost" size="sm">
                      <List className="h-4 w-4 mr-2" />
                      Playlists
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Menu - Only visible on mobile */}
            <MobileMenu isAuthenticated={!!user} />

            {user ? (
              <>
                {(user.role === "ADMIN" || user.role === "CONTRIBUTOR") && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.name?.split(" ")[0] || user.email?.split("@")[0] || "User"}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-gray-600">
                Chant d'Espérance (Songs of Hope) is a comprehensive digital hymnal
                for the Haitian community, featuring bilingual content in French and Kreyòl.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Browse</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-600 hover:text-primary">Home</Link></li>
                <li><Link href="/search" className="text-gray-600 hover:text-primary">Advanced Search</Link></li>
                <li><Link href="/sections/all" className="text-gray-600 hover:text-primary">Browse by Section</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Account</h3>
              <ul className="space-y-2 text-sm">
                {user ? (
                  <>
                    <li><Link href="/favorites" className="text-gray-600 hover:text-primary">My Favorites</Link></li>
                    <li><Link href="/playlists" className="text-gray-600 hover:text-primary">My Playlists</Link></li>
                    <li><Link href="/profile" className="text-gray-600 hover:text-primary">Profile</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login" className="text-gray-600 hover:text-primary">Sign In</Link></li>
                    <li><Link href="/register" className="text-gray-600 hover:text-primary">Register</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Contribute</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/admin/contributions/new" className="text-gray-600 hover:text-primary">Submit a Song</Link></li>
                <li><Link href="/admin/contributions/new" className="text-gray-600 hover:text-primary">Report an Error</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Chant d'Espérance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
