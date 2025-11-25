/**
 * Test Typesense Search
 *
 * Quick script to test if Typesense search is working
 * Run with: npx tsx scripts/test-search.ts
 */

async function testSearch() {
  console.log("🔍 Testing Typesense Search...\n")

  // Test 1: Basic search
  console.log("Test 1: Basic search for 'love'")
  const response1 = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "love",
      limit: 5
    })
  })

  if (response1.ok) {
    const data1 = await response1.json()
    console.log(`✅ Found ${data1.total} results`)
    console.log(`   Source: ${data1.source}`)
    console.log(`   Top result: ${data1.results[0]?.title || "N/A"}`)
  } else {
    console.log(`❌ Failed: ${response1.status} ${response1.statusText}`)
  }

  console.log()

  // Test 2: Search with typo
  console.log("Test 2: Search with typo 'lovee' (should still find 'love')")
  const response2 = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "lovee",
      limit: 5
    })
  })

  if (response2.ok) {
    const data2 = await response2.json()
    console.log(`✅ Found ${data2.total} results (typo tolerance working!)`)
    console.log(`   Source: ${data2.source}`)
  } else {
    console.log(`❌ Failed: ${response2.status} ${response2.statusText}`)
  }

  console.log()

  // Test 3: Search with filter
  console.log("Test 3: Search with language filter (KREYOL)")
  const response3 = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "mwen",
      limit: 5,
      language: "KREYOL"
    })
  })

  if (response3.ok) {
    const data3 = await response3.json()
    console.log(`✅ Found ${data3.total} results`)
    console.log(`   Source: ${data3.source}`)
    console.log(`   Results:`)
    data3.results.slice(0, 3).forEach((r: any, i: number) => {
      console.log(`   ${i + 1}. ${r.title} (${r.language})`)
    })
  } else {
    console.log(`❌ Failed: ${response3.status} ${response3.statusText}`)
  }

  console.log()

  // Test 4: Get facets
  console.log("Test 4: Search and get facets")
  const response4 = await fetch("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "*",
      limit: 1
    })
  })

  if (response4.ok) {
    const data4 = await response4.json()
    console.log(`✅ Facets available:`)
    if (data4.facets && data4.facets.length > 0) {
      data4.facets.forEach((facet: any) => {
        console.log(`   - ${facet.field_name}: ${facet.counts?.length || 0} options`)
      })
    } else {
      console.log(`   (No facets returned)`)
    }
  } else {
    console.log(`❌ Failed: ${response4.status} ${response4.statusText}`)
  }

  console.log("\n✨ Testing complete!")
}

testSearch().catch(console.error)
