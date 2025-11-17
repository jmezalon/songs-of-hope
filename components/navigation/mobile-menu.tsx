"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, Search, BookOpen, Heart, List } from "lucide-react";

interface MobileMenuProps {
  isAuthenticated: boolean;
}

export function MobileMenu({ isAuthenticated }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative md:hidden" ref={menuRef}>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <Menu className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop - for mobile only */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeMenu}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <nav className="py-2">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors duration-150"
              >
                <Search className="h-5 w-5 mr-3" />
                <span className="font-medium">Search</span>
              </Link>

              <Link
                href="/search"
                onClick={closeMenu}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors duration-150"
              >
                <BookOpen className="h-5 w-5 mr-3" />
                <span className="font-medium">Browse</span>
              </Link>

              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-100 my-2" />

                  <Link
                    href="/favorites"
                    onClick={closeMenu}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors duration-150"
                  >
                    <Heart className="h-5 w-5 mr-3" />
                    <span className="font-medium">Favorites</span>
                  </Link>

                  <Link
                    href="/playlists"
                    onClick={closeMenu}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors duration-150"
                  >
                    <List className="h-5 w-5 mr-3" />
                    <span className="font-medium">Playlists</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
