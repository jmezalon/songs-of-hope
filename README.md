# Chant d'Espérance Platform

A full-stack web application for managing and displaying songs from the Haitian Christian hymnal "Chant d'Espérance" (Songs of Hope) plus popular Christian worship songs.

## About

This platform provides a comprehensive digital hymnal experience for the Haitian Christian community, featuring:
- All 9 sections of the Chant d'Espérance hymnal
- Popular contemporary Christian worship songs
- Multilingual support (Haitian Creole, French, English, Spanish)
- Advanced search with autocomplete and full-text search
- User authentication with role-based access control (Admin, Contributor, User)
- Comprehensive admin dashboard for song management
- Responsive design optimized for mobile, tablet, and desktop

 Keep it synced: Run npm run typesense:sync periodically or set up a cron job

## Tech Stack

### Frontend
- **Next.js 16** with Turbopack - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **TanStack Table** - Powerful data tables
- **React Hook Form** - Form validation
- **Zod** - Runtime schema validation

### Backend
- **PostgreSQL** - Relational database with full-text search
- **Prisma ORM** - Type-safe database client
- **NextAuth.js v4** - Authentication solution with credentials provider
- **bcryptjs** - Password hashing

### Features
- **Full-text Search** - Fast PostgreSQL-based search across titles and lyrics
- **Drag-and-Drop Lyrics Editor** - Intuitive lyrics management with verse reordering
- **Theme & Biblical Reference Management** - Organize songs by themes and scripture
- **Media Management** - Attach sheet music, audio, and video links to songs
- **Bulk Operations** - Publish, export, or delete multiple songs at once

## Project Structure

```
songs-of-hope/
├── app/                 # Next.js App Router pages and API routes
├── components/          # Reusable React components
├── lib/                 # Utility functions and database client
├── prisma/             # Database schema and migrations
├── types/              # TypeScript type definitions
├── public/             # Static assets
└── .env                # Environment variables (not in git)
```

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js 18+** and **npm** (or yarn)
- **PostgreSQL 14+** (local or remote)
- **Git** for version control

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd songs-of-hope
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chant_esperance_db?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App Configuration (optional)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate a secure NextAuth secret:**

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET` in your `.env` file.

#### 4. Set Up the Database

**Create the database:**

```bash
# If using PostgreSQL CLI
createdb chant_esperance_db

# Or connect to PostgreSQL and run:
CREATE DATABASE chant_esperance_db;
```

**Push the database schema:**

```bash
npx prisma db push
```

This will create all the necessary tables based on your Prisma schema.

**Generate Prisma Client:**

```bash
npx prisma generate
```

#### 5. Create an Admin User

Before you can use the application, you need to create an admin account:

```bash
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="your-secure-password" \
ADMIN_NAME="Admin User" \
npx tsx scripts/create-admin.ts
```

**Important:** Use a strong password (at least 8 characters).

#### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 7. Login

Navigate to [http://localhost:3000/login](http://localhost:3000/login) and sign in with the admin credentials you created.

### Quick Start Summary

```bash
# 1. Clone and install
git clone <repository-url>
cd songs-of-hope
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database
createdb chant_esperance_db
npx prisma db push
npx prisma generate

# 4. Create admin user
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="SecurePassword123" \
ADMIN_NAME="Admin User" \
npx tsx scripts/create-admin.ts

# 5. Run the app
npm run dev
```

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Sync database with schema
- `npx prisma generate` - Generate Prisma Client

### Code Quality

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Zod** for runtime validation
- **Prisma** for type-safe database queries
- **React Hook Form** for form validation

### Project Structure

```
songs-of-hope/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard pages
│   │   ├── songs/                # Song management
│   │   ├── users/                # User management
│   │   └── layout.tsx            # Admin layout with sidebar
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── songs/                # Song CRUD operations
│   │   └── admin/                # Admin-only endpoints
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout with metadata
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── forms/                    # Form components
│   │   ├── add-song-form.tsx     # Multi-step song form
│   │   ├── lyrics-editor.tsx     # Drag-and-drop lyrics editor
│   │   └── ...
│   ├── ui/                       # shadcn/ui components
│   └── search/                   # Search components
├── lib/                          # Utilities and configurations
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   ├── validations/              # Zod schemas
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration files
├── scripts/                      # Utility scripts
│   └── create-admin.ts           # Create admin user script
└── public/                       # Static assets
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # On macOS with Homebrew
   brew services list

   # On Linux
   sudo systemctl status postgresql
   ```

2. Check your `DATABASE_URL` in `.env`:
   - Ensure the username and password are correct
   - Verify the database name matches the one you created
   - Check the port (default is 5432)

3. Test the connection:
   ```bash
   npx prisma db pull
   ```

### Prisma Issues

If Prisma Client is not generated:

```bash
npx prisma generate
```

If you need to reset the database (development only):

```bash
npx prisma migrate reset
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find the process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or run on a different port
PORT=3001 npm run dev
```

### Authentication Issues

If login fails:

1. Verify the user exists in the database:
   ```bash
   npx prisma studio
   ```

2. Check that `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set in `.env`

3. Clear cookies and try again

### Build Errors

If you encounter build errors:

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Features

### Completed ✅

- [x] Song database with full Chant d'Espérance schema
- [x] Advanced search with autocomplete and filters
- [x] Full-text search across titles and lyrics
- [x] User authentication with NextAuth.js
- [x] Role-based access control (Admin, Contributor, User)
- [x] Song lyrics editor with drag-and-drop verses
- [x] Multi-language support (Français, Kreyòl, English, Spanish, Bilingual)
- [x] Mobile-responsive design
- [x] Admin dashboard for content management
- [x] Theme and biblical reference management
- [x] Media management (sheet music, audio, video links)
- [x] Bulk operations (publish, delete, export to CSV)
- [x] Custom 404 and error pages
- [x] Loading states and skeleton loaders
- [x] SEO optimization with meta tags, sitemap, robots.txt
- [x] User management for admins

### Roadmap 🚀

- [ ] Favorite songs and playlists
- [ ] Print-friendly views
- [ ] Typesense integration for enhanced search
- [ ] Song versioning and history
- [ ] Comments and annotations
- [ ] Public song viewer (non-admin)
- [ ] API documentation
- [ ] Progressive Web App (PWA) support
- [ ] Offline mode
- [ ] Performance monitoring and analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Chant d'Espérance hymnal publishers and contributors
- The Haitian Christian community
- All contributors to this project

## Support

For questions or support, please open an issue in the GitHub repository.
