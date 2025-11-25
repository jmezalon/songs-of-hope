/**
 * Typesense Connection Diagnostic Script
 * Tests the connection and configuration
 */

import { config } from "dotenv"
import { resolve } from "path"
import Typesense from "typesense"

// Load environment variables
config({ path: resolve(process.cwd(), ".env") })

async function diagnose() {
  console.log("\n" + "=".repeat(60))
  console.log("🔍 TYPESENSE CONNECTION DIAGNOSTIC")
  console.log("=".repeat(60) + "\n")

  // Step 1: Check environment variables
  console.log("1️⃣  Checking Environment Variables...")
  console.log("-".repeat(60))

  const adminKey = process.env.TYPESENSE_ADMIN_API_KEY
  const searchKey = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY
  const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST
  const port = process.env.NEXT_PUBLIC_TYPESENSE_PORT
  const protocol = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL

  console.log(`Admin Key: ${adminKey ? '✅ Set (' + adminKey.substring(0, 10) + '...)' : '❌ Missing'}`)
  console.log(`Search Key: ${searchKey ? '✅ Set (' + searchKey.substring(0, 10) + '...)' : '❌ Missing'}`)
  console.log(`Host: ${host || '❌ Missing'}`)
  console.log(`Port: ${port || '❌ Missing'}`)
  console.log(`Protocol: ${protocol || '❌ Missing'}`)

  if (!adminKey || !searchKey || !host || !port || !protocol) {
    console.log("\n❌ ERROR: Missing required environment variables!")
    console.log("Please check your .env file.")
    return
  }

  // Step 2: Test Admin Client Connection
  console.log("\n2️⃣  Testing Admin Client Connection...")
  console.log("-".repeat(60))

  const adminClient = new Typesense.Client({
    nodes: [{ host, port: parseInt(port), protocol }],
    apiKey: adminKey,
    connectionTimeoutSeconds: 10,
  })

  try {
    const health = await adminClient.health.retrieve()
    console.log(`✅ Admin client connected successfully!`)
    console.log(`   Health: ${JSON.stringify(health)}`)
  } catch (error) {
    console.log(`❌ Admin client connection failed!`)
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return
  }

  // Step 3: Test Search Client Connection
  console.log("\n3️⃣  Testing Search Client Connection...")
  console.log("-".repeat(60))

  const searchClient = new Typesense.Client({
    nodes: [{ host, port: parseInt(port), protocol }],
    apiKey: searchKey,
    connectionTimeoutSeconds: 10,
  })

  try {
    // Try to search the songs collection
    const searchResults = await searchClient
      .collections("songs")
      .documents()
      .search({
        q: "test",
        query_by: "title",
        per_page: 1
      })

    console.log(`✅ Search client connected successfully!`)
    console.log(`   Found ${searchResults.found} documents in 'songs' collection`)
  } catch (error) {
    console.log(`❌ Search client connection failed!`)
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

    // Check if it's an auth error
    if (error instanceof Error && error.message.includes("401")) {
      console.log("\n⚠️  This looks like an authentication error.")
      console.log("   The search key might not have the correct permissions.")
      console.log("   Make sure the search key has 'documents:search' permission.")
    }

    return
  }

  // Step 4: Test actual search
  console.log("\n4️⃣  Testing Search Functionality...")
  console.log("-".repeat(60))

  try {
    const searchResults = await searchClient
      .collections("songs")
      .documents()
      .search({
        q: "Jesus",
        query_by: "title,titleKreyol,lyrics,lyricsKreyol,author,composer",
        per_page: 5
      })

    console.log(`✅ Search working!`)
    console.log(`   Query: "Jesus"`)
    console.log(`   Results: ${searchResults.found} found`)

    if (searchResults.hits && searchResults.hits.length > 0) {
      console.log(`   Top result: ${(searchResults.hits[0].document as any).title}`)
    }
  } catch (error) {
    console.log(`❌ Search failed!`)
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return
  }

  // Step 5: Test typo tolerance
  console.log("\n5️⃣  Testing Typo Tolerance...")
  console.log("-".repeat(60))

  try {
    const searchResults = await searchClient
      .collections("songs")
      .documents()
      .search({
        q: "Jesuss", // Intentional typo
        query_by: "title,titleKreyol,lyrics,lyricsKreyol,author,composer",
        per_page: 5,
        num_typos: 2
      })

    console.log(`✅ Typo tolerance working!`)
    console.log(`   Query: "Jesuss" (typo)`)
    console.log(`   Results: ${searchResults.found} found`)

    if (searchResults.hits && searchResults.hits.length > 0) {
      console.log(`   Top result: ${(searchResults.hits[0].document as any).title}`)
    }
  } catch (error) {
    console.log(`❌ Typo tolerance test failed!`)
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log("\n" + "=".repeat(60))
  console.log("✨ DIAGNOSTIC COMPLETE")
  console.log("=".repeat(60) + "\n")
}

diagnose().catch(console.error)
