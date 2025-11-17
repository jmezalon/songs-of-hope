"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface RemoveFromPlaylistButtonProps {
  playlistId: string;
  songId: string;
  songTitle: string;
}

export function RemoveFromPlaylistButton({
  playlistId,
  songId,
  songTitle,
}: RemoveFromPlaylistButtonProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove "${songTitle}" from this playlist?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove song from playlist");
      }
    } catch (error) {
      console.error("Remove from playlist error:", error);
      alert("Failed to remove song from playlist");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={isRemoving}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isRemoving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <X className="h-4 w-4 mr-2" />
          Remove
        </>
      )}
    </Button>
  );
}
