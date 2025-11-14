# Chant d'Espérance Platform

A full-stack web application for managing and displaying songs from the Haitian Christian hymnal "Chant d'Espérance" (Songs of Hope) plus popular Christian worship songs.

## About

This platform provides a comprehensive digital hymnal experience for the Haitian Christian community, featuring:
- All 9 sections of the Chant d'Espérance hymnal
- Popular contemporary Christian worship songs
- Multilingual support (Haitian Creole, French, English)
- Advanced search capabilities
- User authentication and personalization

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database client
- **NextAuth.js** - Authentication solution

### Future Enhancements
- **Typesense** - Fast, typo-tolerant search engine (planned)

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

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd songs-of-hope
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database credentials and other configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chant_esperance_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

4. Set up the database:
```bash
# Create database schema
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

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

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Zod for runtime validation

## Features Roadmap

- [ ] Song database with full Chant d'Espérance collection
- [ ] Advanced search with filters (by section, title, lyrics)
- [ ] User authentication and profiles
- [ ] Favorite songs and playlists
- [ ] Song lyrics display with multiple verses
- [ ] Print-friendly views
- [ ] Mobile-responsive design
- [ ] Typesense integration for powerful search
- [ ] Multi-language support
- [ ] Audio/video integration
- [ ] Admin dashboard for content management

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
