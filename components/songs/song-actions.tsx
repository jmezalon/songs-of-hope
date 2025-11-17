"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  Printer,
  Maximize2,
  Share2,
  List,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { AddToPlaylistDialog } from "@/components/playlists/add-to-playlist-dialog";
import { toast } from "sonner";

interface SongActionsProps {
  songId: string;
  songNumber: number | null;
  title: string;
  isFavorite: boolean;
  userId?: string;
}

export function SongActions({
  songId,
  songNumber,
  title,
  isFavorite: initialIsFavorite,
  userId,
}: SongActionsProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleProjection = () => {
    router.push(`/songs/${songId}/projection`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${songNumber}. ${title}`,
          text: `Check out this hymn from Chant d'Espérance`,
          url,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("Share failed:", error)
        toast.error("Unable to share this song.")
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard")
      } catch (error) {
        console.error("Copy failed:", error)
        toast.error("Failed to copy link")
      }
    }
  };

  const toggleFavorite = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    setIsTogglingFavorite(true);
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch("/api/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update favorite");
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
      alert("Failed to update favorite");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleAddToPlaylist = () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setShowPlaylistDialog(true);
  };

  return (
    <>
      <Card className="p-4 mb-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
              className="gap-2"
            >
              {isTogglingFavorite ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              )}
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>

            <Button
              variant="outline"
              onClick={handleAddToPlaylist}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Add to Playlist
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={handleProjection}
              className="gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Projection
            </Button>

            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {showPlaylistDialog && (
        <AddToPlaylistDialog
          songId={songId}
          open={showPlaylistDialog}
          onOpenChange={setShowPlaylistDialog}
        />
      )}
    </>
  );
}
