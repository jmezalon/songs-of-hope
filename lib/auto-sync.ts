import { exec } from "child_process"
import { promisify } from "util"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

const SYNC_TRACKING_FILE = path.join(process.cwd(), ".typesense-sync-state.json")
const SONGS_THRESHOLD = 5

interface SyncState {
  lastSyncTimestamp: string
  songsCountAtLastSync: number
}

/**
 * Get the current sync state from file
 */
async function getSyncState(): Promise<SyncState | null> {
  try {
    const data = await fs.readFile(SYNC_TRACKING_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

/**
 * Save sync state to file
 */
async function saveSyncState(state: SyncState): Promise<void> {
  await fs.writeFile(SYNC_TRACKING_FILE, JSON.stringify(state, null, 2), "utf-8")
}

/**
 * Count new songs since last sync
 */
async function countNewSongs(lastSyncTimestamp: string): Promise<number> {
  const count = await prisma.song.count({
    where: {
      createdAt: {
        gt: new Date(lastSyncTimestamp),
      },
    },
  })
  return count
}

/**
 * Run the Typesense sync script
 */
async function runTypesenseSync(): Promise<void> {
  console.log("🔄 Running Typesense sync...")
  try {
    const { stdout, stderr } = await execAsync("npm run typesense:sync")
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
    console.log("✅ Typesense sync completed")
  } catch (error) {
    console.error("❌ Typesense sync failed:", error)
    throw error
  }
}

/**
 * Check if sync is needed and trigger it if threshold is reached
 * Call this function after creating or updating songs
 */
export async function checkAndSyncIfNeeded(): Promise<void> {
  // Skip if Typesense is not configured
  if (!process.env.NEXT_PUBLIC_TYPESENSE_HOST || !process.env.TYPESENSE_ADMIN_API_KEY) {
    return
  }

  try {
    const state = await getSyncState()

    if (!state) {
      // First time, initialize state
      const totalSongs = await prisma.song.count()
      await saveSyncState({
        lastSyncTimestamp: new Date().toISOString(),
        songsCountAtLastSync: totalSongs,
      })
      console.log(`📊 Initialized sync state: ${totalSongs} songs`)
      return
    }

    // Count new songs since last sync
    const newSongsCount = await countNewSongs(state.lastSyncTimestamp)

    if (newSongsCount >= SONGS_THRESHOLD) {
      console.log(`📈 ${newSongsCount} new songs detected (threshold: ${SONGS_THRESHOLD}). Triggering sync...`)

      // Run sync in background (don't await to avoid blocking)
      runTypesenseSync()
        .then(async () => {
          const totalSongs = await prisma.song.count()
          await saveSyncState({
            lastSyncTimestamp: new Date().toISOString(),
            songsCountAtLastSync: totalSongs,
          })
        })
        .catch((error) => {
          console.error("Failed to update sync state after sync:", error)
        })
    } else {
      console.log(`ℹ️  ${newSongsCount}/${SONGS_THRESHOLD} new songs since last sync`)
    }
  } catch (error) {
    console.error("Error checking sync status:", error)
    // Don't throw - we don't want to break song creation if sync checking fails
  }
}

/**
 * Reset the sync state
 * Useful for manual syncs or after running npm run typesense:sync manually
 */
export async function resetSyncState(): Promise<void> {
  const totalSongs = await prisma.song.count()
  await saveSyncState({
    lastSyncTimestamp: new Date().toISOString(),
    songsCountAtLastSync: totalSongs,
  })
  console.log(`🔄 Sync state reset: ${totalSongs} songs`)
}
