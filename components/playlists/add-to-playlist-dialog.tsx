"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, List, Loader2, Check } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  _count: {
    songs: number;
  };
}

interface AddToPlaylistDialogProps {
  songId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToPlaylistDialog({
  songId,
  open,
  onOpenChange,
}: AddToPlaylistDialogProps) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<string>>(new Set());

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  useEffect(() => {
    if (open) {
      fetchPlaylists();
    }
  }, [open]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/playlists");
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlaylistName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDescription || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add song to the newly created playlist
        await addToPlaylist(data.playlist.id);
        // Refresh playlists
        await fetchPlaylists();
        // Reset form
        setNewPlaylistName("");
        setNewPlaylistDescription("");
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Create playlist error:", error);
      alert("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    setIsAdding(playlistId);
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });

      if (response.ok) {
        setAddedToPlaylists((prev) => new Set(prev).add(playlistId));
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add song to playlist");
      }
    } catch (error) {
      console.error("Add to playlist error:", error);
      alert("Failed to add song to playlist");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Choose a playlist or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Create New Playlist */}
          {showCreateForm ? (
            <Card className="p-4">
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Playlist Name</Label>
                  <Input
                    id="playlist-name"
                    placeholder="My Playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playlist-description">
                    Description (optional)
                  </Label>
                  <Input
                    id="playlist-description"
                    placeholder="Playlist description..."
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isCreating || !newPlaylistName.trim()}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create & Add
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Playlist
            </Button>
          )}

          {/* Existing Playlists */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading playlists...</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <List className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No playlists yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first playlist above
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {playlists.map((playlist) => {
                const isAdded = addedToPlaylists.has(playlist.id);
                const isAddingThis = isAdding === playlist.id;

                return (
                  <Card
                    key={playlist.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isAdded
                        ? "bg-green-50 border-green-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => !isAdded && !isAddingThis && addToPlaylist(playlist.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold line-clamp-1">
                          {playlist.name}
                        </h4>
                        {playlist.description && (
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {playlist.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {playlist._count.songs} songs
                        </p>
                      </div>
                      {isAddingThis ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : isAdded ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
