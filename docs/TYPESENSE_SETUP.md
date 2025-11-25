# Typesense Search Setup

This document explains how to set up Typesense for advanced search functionality in the Songs of Hope application.

## Features

The Typesense integration provides:

- **Lightning-fast search** - Sub-50ms search responses
- **Typo tolerance** - Finds results even with spelling mistakes
- **Prefix searching** - Autocomplete functionality
- **Faceted search** - Filter by language, collection, section, themes, tags
- **Relevance ranking** - Smart ranking based on match quality
- **Highlighted results** - Shows where matches were found
- **Scalable** - Handles millions of songs efficiently

## Option 1: Typesense Cloud (Recommended for Production)

Typesense Cloud is the easiest way to get started, with automatic scaling and zero maintenance.

### Step 1: Create a Typesense Cloud Account

1. Go to [https://cloud.typesense.org](https://cloud.typesense.org)
2. Sign up for a free account
3. Create a new cluster
4. Choose your region (select closest to your users)
5. Note down your cluster details

### Step 2: Get API Keys

From your Typesense Cloud dashboard:
1. Go to "API Keys"
2. Copy the **Admin API Key** (for indexing)
3. Create a **Search-only API Key** with these settings:
   - Collections: `songs`
   - Actions: `documents:search`
   - No expiration (or set your preferred expiration)

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
# Typesense Admin API Key (server-side only)
TYPESENSE_ADMIN_API_KEY="your-admin-api-key-here"

# Search-only API Key (can be exposed to client)
NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY="your-search-only-api-key-here"
NEXT_PUBLIC_TYPESENSE_HOST="xxx.a1.typesense.net"
NEXT_PUBLIC_TYPESENSE_PORT="443"
NEXT_PUBLIC_TYPESENSE_PROTOCOL="https"
```

Replace `xxx.a1.typesense.net` with your actual cluster hostname.

## Option 2: Self-Hosted Typesense

For development or if you prefer to host your own instance.

### Using Docker (Recommended)

```bash
# Create a data directory
mkdir -p $(pwd)/typesense-data

# Run Typesense
docker run -d \
  --name typesense \
  -p 8108:8108 \
  -v$(pwd)/typesense-data:/data \
  typesense/typesense:27.1 \
  --data-dir /data \
  --api-key=your-secret-api-key-here \
  --enable-cors
```

### Configure Environment Variables

For local development:

```bash
# Typesense Admin API Key
TYPESENSE_ADMIN_API_KEY="your-secret-api-key-here"

# Search-only API Key (use same for local dev)
NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY="your-secret-api-key-here"
NEXT_PUBLIC_TYPESENSE_HOST="localhost"
NEXT_PUBLIC_TYPESENSE_PORT="8108"
NEXT_PUBLIC_TYPESENSE_PROTOCOL="http"
```

## Indexing Songs

After configuration, sync your songs to Typesense:

### Initial Sync

```bash
npm run typesense:sync
```

This will:
- Create the `songs` collection if it doesn't exist
- Index all songs from your database
- Show progress and summary

### Reset and Re-sync

To drop the existing collection and start fresh:

```bash
npm run typesense:sync:reset
```

### Custom Batch Size

For large databases, adjust the batch size:

```bash
npx tsx scripts/sync-typesense.ts --batch-size=200
```

## Keeping Index Updated

To keep Typesense in sync with your database, you have several options:

### Option 1: Periodic Sync (Simple)

Set up a cron job to run the sync script:

```bash
# Every hour
0 * * * * cd /path/to/app && npm run typesense:sync

# Or every 15 minutes
*/15 * * * * cd /path/to/app && npm run typesense:sync
```

### Option 2: Real-time Updates (Advanced)

Modify your song CRUD operations to update Typesense:

```typescript
import { indexSong, removeSong } from "@/lib/typesense"

// After creating a song
await prisma.song.create({ data })
await indexSong(newSong)

// After updating a song
await prisma.song.update({ where: { id }, data })
await indexSong(updatedSong)

// After deleting a song
await prisma.song.delete({ where: { id } })
await removeSong(id)
```

### Option 3: Database Triggers (Production)

Use Prisma middleware or database triggers to automatically sync changes.

## Using the Search API

### Basic Search

```typescript
const response = await fetch("/api/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "amazing grace",
    limit: 20
  })
})

const data = await response.json()
console.log(data.results) // Search results
console.log(data.source)  // "typesense" or "database"
```

### Search with Filters

```typescript
const response = await fetch("/api/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "love",
    limit: 20,
    language: "FRANCAIS",
    collectionId: "collection-id",
    themes: ["worship", "praise"],
    tags: ["contemporary"]
  })
})
```

### Disable Typesense (Fallback to Database)

```typescript
const response = await fetch("/api/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "grace",
    useTypesense: false  // Use database search
  })
})
```

## Response Format

```json
{
  "query": "amazing grace",
  "results": [
    {
      "id": "song-id",
      "title": "Amazing Grace",
      "titleKreyol": null,
      "songNumber": 123,
      "author": "John Newton",
      "composer": null,
      "firstLine": "Amazing grace, how sweet the sound",
      "language": "ENGLISH",
      "collection": {
        "name": "Hymnal 2024"
      },
      "section": {
        "name": "Worship"
      },
      "relevanceScore": 150.5,
      "matchedFields": ["title", "lyrics"],
      "matchContext": [
        {
          "type": "title",
          "text": "<mark>Amazing Grace</mark>"
        }
      ]
    }
  ],
  "total": 1,
  "facets": [
    {
      "field_name": "language",
      "counts": [
        { "value": "ENGLISH", "count": 50 },
        { "value": "FRANCAIS", "count": 30 }
      ]
    }
  ],
  "source": "typesense"
}
```

## Troubleshooting

### Connection Errors

**Error**: `Could not connect to Typesense`

- **Cloud**: Check if your cluster is running in the dashboard
- **Self-hosted**: Verify Docker container is running: `docker ps`
- **Network**: Ensure firewall allows connections to port 8108 (self-hosted) or 443 (cloud)

### Indexing Fails

**Error**: `Collection not found`

Run sync with reset flag:
```bash
npm run typesense:sync:reset
```

### Search Returns No Results

1. **Check if songs are indexed**:
   ```bash
   curl http://localhost:8108/collections/songs/documents \
     -H "X-TYPESENSE-API-KEY: your-admin-key"
   ```

2. **Try database search** to verify the issue is with Typesense:
   ```typescript
   { query: "test", useTypesense: false }
   ```

3. **Re-index all songs**:
   ```bash
   npm run typesense:sync:reset
   ```

### Slow Search Performance

- **Cloud**: Check if you need to upgrade your cluster size
- **Self-hosted**: Increase Docker container resources
- **Data**: Consider reducing the number of facets or indexed fields

## Performance Tips

1. **Use Search-only API Keys** on the client-side to prevent unauthorized indexing
2. **Enable CORS** properly for your domain
3. **Set up a CDN** if using Typesense Cloud for global distribution
4. **Monitor search analytics** in the Typesense dashboard
5. **Regular re-indexing** keeps the search quality high

## Cost Considerations

### Typesense Cloud

- **Free tier**: 1M search operations/month
- **Paid plans**: Start at $0.03 per 1000 search requests
- **No hidden costs**: Predictable pricing

### Self-Hosted

- **Development**: Free with Docker
- **Production**: Server costs + maintenance time
- **Recommended**: 2GB RAM minimum, 4GB+ for larger datasets

## Next Steps

1. ✅ Complete setup above
2. ✅ Run initial sync: `npm run typesense:sync`
3. ✅ Test search in your application
4. 🎯 Set up periodic syncing (cron job or real-time)
5. 🎯 Monitor search performance and usage
6. 🎯 Customize search ranking and relevance

## Resources

- [Typesense Documentation](https://typesense.org/docs/)
- [Typesense Cloud Dashboard](https://cloud.typesense.org)
- [Typesense GitHub](https://github.com/typesense/typesense)
- [Community Forum](https://github.com/typesense/typesense/discussions)
