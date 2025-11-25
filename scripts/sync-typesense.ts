/**
 * Sync Script for Typesense
 *
 * This script syncs all songs from the database to Typesense search index.
 * Run with: npx tsx scripts/sync-typesense.ts
 *
 * Options:
 * --reset: Drop and recreate the collection before syncing
 * --batch-size=N: Set the batch size for indexing (default: 100)
 */

import { PrismaClient } from "@prisma/client"
import {
  typesenseAdminClient,
  initializeTypesenseCollections,
  indexSong,
  SONGS_COLLECTION_NAME,
  songsCollectionSchema,
} from "../lib/typesense"

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const shouldReset = args.includes("--reset")
const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="))
const batchSize = batchSizeArg
  ? parseInt(batchSizeArg.split("=")[1])
  : 100

async function resetCollection() {
  console.log("🗑️  Resetting collection...")
  try {
    await typesenseAdminClient.collections(SONGS_COLLECTION_NAME).delete()
    console.log("✅ Collection deleted")
  } catch (error) {
    console.log("ℹ️  Collection doesn't exist, skipping deletion")
  }

  await typesenseAdminClient.collections().create(songsCollectionSchema)
  console.log("✅ Collection recreated")
}

async function syncSongs() {
  console.log("\n🎵 Starting Typesense sync...\n")

  // Reset collection if requested
  if (shouldReset) {
    await resetCollection()
  } else {
    // Initialize collections (create if doesn't exist)
    const initResult = await initializeTypesenseCollections()
    console.log(`ℹ️  ${initResult.message}\n`)
  }

  // Fetch all songs with related data
  console.log("📊 Fetching songs from database...")
  const songs = await prisma.song.findMany({
    include: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
        },
      },
      themes: {
        include: {
          theme: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  console.log(`✅ Found ${songs.length} songs\n`)

  if (songs.length === 0) {
    console.log("⚠️  No songs to index")
    return
  }

  // Index songs in batches
  console.log(`📤 Indexing songs in batches of ${batchSize}...\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ songId: string; error: string }> = []

  for (let i = 0; i < songs.length; i += batchSize) {
    const batch = songs.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(songs.length / batchSize)

    console.log(`Processing batch ${batchNumber}/${totalBatches} (songs ${i + 1}-${Math.min(i + batchSize, songs.length)})...`)

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map((song) => indexSong(song))
    )

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        successCount++
      } else {
        errorCount++
        const song = batch[index]
        const error =
          result.status === "rejected"
            ? result.reason
            : result.value.error || "Unknown error"
        errors.push({ songId: song.id, error })
      }
    })

    // Progress update
    const progress = Math.round(((i + batch.length) / songs.length) * 100)
    console.log(`  ✓ Progress: ${progress}% (${successCount} success, ${errorCount} errors)\n`)
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 Sync Summary")
  console.log("=".repeat(60))
  console.log(`✅ Successfully indexed: ${successCount} songs`)
  console.log(`❌ Failed to index: ${errorCount} songs`)
  console.log(`📈 Success rate: ${((successCount / songs.length) * 100).toFixed(2)}%`)

  if (errors.length > 0) {
    console.log("\n❌ Errors:")
    errors.slice(0, 10).forEach((err) => {
      console.log(`  - Song ${err.songId}: ${err.error}`)
    })
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`)
    }
  }

  console.log("\n✨ Sync completed!\n")
}

// Main execution
async function main() {
  try {
    await syncSongs()
  } catch (error) {
    console.error("\n❌ Fatal error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
