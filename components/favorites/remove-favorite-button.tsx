"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

interface RemoveFavoriteButtonProps {
  songId: string;
  songTitle: string;
}

export function RemoveFavoriteButton({
  songId,
  songTitle,
}: RemoveFavoriteButtonProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove "${songTitle}" from your favorites?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove favorite");
      }
    } catch (error) {
      console.error("Remove favorite error:", error);
      alert("Failed to remove favorite");
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
          <Heart className="h-4 w-4 fill-current mr-2" />
          Remove
        </>
      )}
    </Button>
  );
}
