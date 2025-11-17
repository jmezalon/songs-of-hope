"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Type,
  Maximize,
  Minimize,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectionViewProps {
  song: any; // Using any to accept Prisma's return type
}

type FontSize = "small" | "medium" | "large" | "xlarge";
type BackgroundColor = "black" | "dark" | "blue" | "white";

export function ProjectionView({ song }: ProjectionViewProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>("large");
  const [bgColor, setBgColor] = useState<BackgroundColor>("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKreyol, setShowKreyol] = useState(true);

  // Create slides: title + each verse
  const slides = [
    {
      type: "title",
      content: {
        title: song.title || song.titleKreyol || "Untitled",
        titleKreyol: song.titleKreyol,
        songNumber: song.songNumber,
      },
    },
    ...song.verses.map((verse: any) => ({
      type: "verse",
      content: verse,
    })),
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          nextSlide();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prevSlide();
          break;
        case "Home":
          e.preventDefault();
          setCurrentSlide(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentSlide(totalSlides - 1);
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
          } else {
            router.back();
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
        case "C":
          e.preventDefault();
          setShowControls((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, totalSlides, router]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", resetTimeout);
    resetTimeout();

    return () => {
      window.removeEventListener("mousemove", resetTimeout);
      clearTimeout(timeout);
    };
  }, []);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "small":
        return "text-3xl";
      case "medium":
        return "text-4xl";
      case "large":
        return "text-5xl";
      case "xlarge":
        return "text-6xl";
    }
  };

  const getBgColorClass = () => {
    switch (bgColor) {
      case "black":
        return "bg-black text-white";
      case "dark":
        return "bg-gray-900 text-white";
      case "blue":
        return "bg-blue-900 text-white";
      case "white":
        return "bg-white text-black";
    }
  };

  const getVerseLabel = (verse: any) => {
    const type = verse.verseType;
    const num = verse.verseNumber;

    switch (type) {
      case "CHORUS":
      case "REFRAIN":
        return "Refrain";
      case "BRIDGE":
        return "Bridge";
      default:
        return num ? `Verse ${num}` : "Verse";
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`min-h-screen flex flex-col ${getBgColorClass()}`}>
      {/* Controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-black/80 backdrop-blur-sm p-4">
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-2" />
                Exit
              </Button>
              <span className="text-white text-sm">
                Slide {currentSlide + 1} of {totalSlides}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Font Size
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Font Size</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFontSize("small")}>
                    Small {fontSize === "small" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize("medium")}>
                    Medium {fontSize === "medium" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize("large")}>
                    Large {fontSize === "large" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize("xlarge")}>
                    Extra Large {fontSize === "xlarge" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Background
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Background</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setBgColor("black")}>
                    Black {bgColor === "black" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBgColor("dark")}>
                    Dark Gray {bgColor === "dark" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBgColor("blue")}>
                    Blue {bgColor === "blue" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBgColor("white")}>
                    White {bgColor === "white" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKreyol(!showKreyol)}
                className="text-white hover:bg-white/20"
              >
                {showKreyol ? "Hide" : "Show"} Kreyòl
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize className="h-4 w-4 mr-2" />
                )}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-6xl">
          {currentSlideData.type === "title" ? (
            <div className="text-center space-y-6">
              <div className="text-4xl md:text-6xl font-bold opacity-60 mb-8">
                #{currentSlideData.content.songNumber}
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                {currentSlideData.content.title}
              </h1>
              {showKreyol &&
                currentSlideData.content.titleKreyol &&
                currentSlideData.content.titleKreyol !== currentSlideData.content.title && (
                  <h2 className="text-4xl md:text-6xl lg:text-7xl opacity-80 leading-tight">
                    {currentSlideData.content.titleKreyol}
                  </h2>
                )}
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-2xl md:text-3xl font-semibold opacity-70 text-center">
                {getVerseLabel(currentSlideData.content)}
              </h2>
              <div className={`space-y-4 ${getFontSizeClass()} leading-relaxed`}>
                {currentSlideData.content.lines.map((line: any) => (
                  <div
                    key={line.id}
                    style={{ paddingLeft: `${line.indent * 2}rem` }}
                  >
                    {line.text && <p className="font-medium">{line.text}</p>}
                    {showKreyol && line.textKreyol && line.textKreyol !== line.text && (
                      <p className="opacity-80 italic mt-2">{line.textKreyol}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-black/80 backdrop-blur-sm p-4">
          <div className="container flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6 mr-2" />
              Previous
            </Button>

            <div className="text-white text-sm">
              Use arrow keys or space to navigate • Press C to hide controls • Press F for fullscreen
            </div>

            <Button
              variant="ghost"
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="text-white hover:bg-white/20"
            >
              Next
              <ChevronRight className="h-6 w-6 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
