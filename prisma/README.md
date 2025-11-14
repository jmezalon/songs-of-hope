# Prisma Database Schema

This directory contains the Prisma schema and seed data for the Chant d'Espérance platform.

## Database Schema Overview

### Core Models

- **Collection**: Hymnal books (Chant d'Espérance, Popular Songs)
- **Section**: 9 sections of Chant d'Espérance hymnal
- **Song**: Main songs table with full metadata
- **Verse**: Verses, chorus, bridge, etc.
- **Line**: Individual lyric lines within verses

### Categorization

- **Theme**: Tags/categories (seasons, occasions, moods, liturgical)
- **BiblicalReference**: Scripture references for songs

### Media

- **Media**: Sheet music, audio files, videos, PDFs

### User Features

- **User**: Admin and contributor accounts
- **Favorite**: User favorite songs
- **Playlist** & **PlaylistSong**: User-created playlists
- **SearchHistory**: Track user searches
- **Contribution**: User submissions and corrections

## Important Schema Design Notes

### Language Handling

Each section in Chant d'Espérance has **French and Kreyòl hymns numbered independently**. These are **DIFFERENT songs**, not translations!

Example:
- "23 Français Mélodies Joyeuses" (French hymn #23)
- "23 Kreyòl Mélodies Joyeuses" (Kreyòl hymn #23)

These are companion songs (linked via `companionSongId`), but they are distinct compositions, not translations of each other.

### The 9 Sections

1. **Chant d'Espérance** (Chan Espérans)
2. **Mélodies Joyeuses** (Melodi Jwayez)
3. **Réveillons-Nous** (Ann Reveye)
4. **La Voix du Réveil** (Vwa Revèy la)
5. **Échos des Élus** (Eko Eli yo)
6. **Gloire à l'Agneau** (Glwa pou Mouton an)
7. **Haiti Chante Avec Radio Lumière** (Ayiti Chante Avèk Radyo Limyè)
8. **Réveillons-Nous Chrétiens** (Ann Reveye Kretyen)
9. **L'Ombre du Réveil** (Lonbraj Revèy la)

## Setup Instructions

### 1. Configure Database Connection

Make sure your `.env` file has the correct DATABASE_URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/chant_esperance_db?schema=public"
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
# or
npx prisma generate
```

### 3. Push Schema to Database

For development (no migrations):

```bash
npm run prisma:push
# or
npx prisma db push
```

For production (with migrations):

```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database

```bash
npm run prisma:seed
# or
npx prisma db seed
```

This will create:
- Chant d'Espérance collection
- All 9 sections
- Popular Songs collection
- Common themes (Christmas, Easter, Praise, etc.)
- Admin user: `admin@chantesperance.com` / `admin123`

### 5. View Database (Optional)

```bash
npm run prisma:studio
# or
npx prisma studio
```

Opens a GUI at `http://localhost:5555` to view and edit your database.

## Common Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Create a migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Indexes

The schema includes strategic indexes for:
- Collection and section lookups
- Song searches by title, language, status
- Song number within sections
- User favorites and playlists
- Search history
- Theme categorization

## Relations

Key relationships:
- Collection → Sections (one-to-many)
- Section → Songs (one-to-many)
- Song → Verses → Lines (nested one-to-many)
- Song ↔ Song (self-relation for companion songs)
- Song ↔ Themes (many-to-many via SongTheme)
- Song ↔ BiblicalReference (many-to-many)
- User → Favorites, Playlists, Contributions (one-to-many)

## Enums

- **Language**: FRANCAIS, KREYOL, BILINGUAL, ENGLISH
- **SongStatus**: DRAFT, PUBLISHED, ARCHIVED, PENDING_REVIEW
- **CopyrightStatus**: PUBLIC_DOMAIN, COPYRIGHTED, CREATIVE_COMMONS, UNKNOWN
- **VerseType**: VERSE, CHORUS, REFRAIN, BRIDGE, INTRO, OUTRO, CODA
- **ThemeCategory**: OCCASION, SEASON, TOPIC, MOOD, LITURGICAL, BIBLICAL
- **MediaType**: SHEET_MUSIC, AUDIO, VIDEO, IMAGE, PDF
- **UserRole**: ADMIN, CONTRIBUTOR, USER
- **ContributionStatus**: PENDING, APPROVED, REJECTED, NEEDS_REVISION
- **ContributionType**: NEW_SONG, CORRECTION, TRANSLATION, METADATA, MEDIA

## Troubleshooting

### Connection Issues

If you get "Can't reach database server":
1. Check PostgreSQL is running: `sudo service postgresql status`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql -h localhost -U username -d chant_esperance_db`

### Migration Issues

If migrations fail:
1. Check schema syntax: `npx prisma validate`
2. Reset database (development only): `npx prisma migrate reset`
3. Use db push instead: `npx prisma db push`

### Seed Issues

If seed fails:
1. Ensure Prisma Client is generated: `npx prisma generate`
2. Check database is accessible
3. Run seed directly: `tsx prisma/seed.ts`
