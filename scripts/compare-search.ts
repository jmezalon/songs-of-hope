/**
 * Compare Typesense vs Database Search Performance
 */

async function compareSearch(query: string) {
  console.log(`\n🔍 Comparing search for: "${query}"`)
  console.log("=".repeat(60))

  // Test 1: Typesense
  const start1 = Date.now()
  const response1 = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 10, useTypesense: true })
  })
  const data1 = await response1.json()
  const time1 = Date.now() - start1

  console.log("\n⚡ TYPESENSE:")
  console.log(`   Time: ${time1}ms`)
  console.log(`   Results: ${data1.total}`)
  console.log(`   Source: ${data1.source}`)
  if (data1.results?.[0]) {
    console.log(`   Top: ${data1.results[0].title} (score: ${data1.results[0].relevanceScore})`)
  }

  // Test 2: Database
  const start2 = Date.now()
  const response2 = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 10, useTypesense: false })
  })
  const data2 = await response2.json()
  const time2 = Date.now() - start2

  console.log("\n🐢 DATABASE:")
  console.log(`   Time: ${time2}ms`)
  console.log(`   Results: ${data2.total}`)
  console.log(`   Source: ${data2.source}`)
  if (data2.results?.[0]) {
    console.log(`   Top: ${data2.results[0].title} (score: ${data2.results[0].relevanceScore})`)
  }

  console.log("\n📊 COMPARISON:")
  console.log(`   Speedup: ${(time2 / time1).toFixed(2)}x faster`)
  console.log(`   Time saved: ${time2 - time1}ms`)
}

async function main() {
  console.log("\n" + "=".repeat(60))
  console.log("🏎️  TYPESENSE vs DATABASE PERFORMANCE TEST")
  console.log("=".repeat(60))

  // Test various search queries
  await compareSearch("Jesus")
  await compareSearch("love")
  await compareSearch("mwen")

  // Test with typo (Typesense should handle, database won't)
  console.log("\n\n🔤 TYPO TOLERANCE TEST:")
  console.log("=".repeat(60))
  await compareSearch("Jesuss") // typo

  console.log("\n\n✨ Testing complete!\n")
}

main().catch(console.error)
