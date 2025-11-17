"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, BookOpen, Heart, List } from "lucide-react";

interface MobileMenuProps {
  isAuthenticated: boolean;
}

export function MobileMenu({ isAuthenticated }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={closeMenu}
          />

          {/* Slide-out Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white z-50 shadow-lg md:hidden">
            {/* Close Button */}
            <div className="flex justify-end p-4 border-b">
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col p-4 gap-2">
              <Link href="/" onClick={closeMenu}>
                <Button variant="ghost" className="w-full justify-start" size="lg">
                  <Search className="h-5 w-5 mr-3" />
                  Search
                </Button>
              </Link>

              <Link href="/search" onClick={closeMenu}>
                <Button variant="ghost" className="w-full justify-start" size="lg">
                  <BookOpen className="h-5 w-5 mr-3" />
                  Browse
                </Button>
              </Link>

              {isAuthenticated && (
                <>
                  <Link href="/favorites" onClick={closeMenu}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Heart className="h-5 w-5 mr-3" />
                      Favorites
                    </Button>
                  </Link>

                  <Link href="/playlists" onClick={closeMenu}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <List className="h-5 w-5 mr-3" />
                      Playlists
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
