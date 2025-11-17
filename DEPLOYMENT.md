# Deployment Guide

This guide covers deploying the Chant d'Espérance platform to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deploying to Vercel](#deploying-to-vercel)
- [Deploying to Railway](#deploying-to-railway)
- [Deploying to Other Platforms](#deploying-to-other-platforms)
- [Post-Deployment Steps](#post-deployment-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- A PostgreSQL database (Vercel Postgres, Supabase, Railway, or any other provider)
- A Vercel account (or your preferred hosting platform)
- Git repository with your code
- All environment variables ready

## Environment Variables

### Required Environment Variables

```env
# Database Connection
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-production-secret-key"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
```

### Generating Secure Secrets

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

**Important:** Never commit secrets to your repository. Always use environment variables.

## Database Setup

### Option 1: Vercel Postgres

1. Go to your Vercel project dashboard
2. Click on the "Storage" tab
3. Create a new Postgres database
4. Copy the `DATABASE_URL` connection string
5. Add it to your environment variables

### Option 2: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database
3. Copy the "Connection string" (URI format)
4. Replace `[YOUR-PASSWORD]` with your database password
5. Add it to your environment variables

### Option 3: Railway

1. Create a new PostgreSQL service in your Railway project
2. Copy the `DATABASE_URL` from the service variables
3. Add it to your environment variables

### Running Migrations

After setting up your database, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma db push

# Or through your deployment platform
npx prisma migrate deploy
```

## Deploying to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import project to Vercel**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**

   In the Vercel dashboard, add the following environment variables:

   ```
   DATABASE_URL
   NEXTAUTH_URL
   NEXTAUTH_SECRET
   NEXT_PUBLIC_APP_URL
   ```

4. **Deploy**

   Click "Deploy" and wait for the build to complete.

5. **Set up custom domain** (Optional)

   - Go to your project settings
   - Click on "Domains"
   - Add your custom domain

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

4. **Add environment variables**

   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXT_PUBLIC_APP_URL
   ```

5. **Redeploy with environment variables**

   ```bash
   vercel --prod
   ```

## Deploying to Railway

1. **Create a new project**

   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Add PostgreSQL database**

   - Click "New" > "Database" > "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` variable

3. **Configure environment variables**

   Add the following variables in the Railway dashboard:

   ```
   NEXTAUTH_URL (your Railway URL or custom domain)
   NEXTAUTH_SECRET
   NEXT_PUBLIC_APP_URL
   ```

4. **Run database migrations**

   Add a build script to your deployment:

   ```bash
   npx prisma migrate deploy && npm run build
   ```

5. **Deploy**

   Railway will automatically deploy when you push to your repository.

## Deploying to Other Platforms

### DigitalOcean App Platform

1. Create a new app from GitHub
2. Add a PostgreSQL database
3. Configure environment variables
4. Set build command: `npm run build`
5. Set run command: `npm start`

### Netlify

Note: Netlify requires additional configuration for Next.js API routes. Consider using the Next.js Runtime plugin.

### AWS (ECS/Elastic Beanstalk)

Requires containerization with Docker. See Docker deployment guide.

## Post-Deployment Steps

### 1. Create Admin User

After deploying, create an admin user:

```bash
# Using Vercel CLI
vercel env pull .env.local
ADMIN_EMAIL="admin@yourdomain.com" \
ADMIN_PASSWORD="SecurePassword123" \
ADMIN_NAME="Admin User" \
npx tsx scripts/create-admin.ts

# Then push the changes to the database
```

Alternatively, use Prisma Studio:

```bash
npx prisma studio
```

And manually create a user with:
- Email: your email
- Password: hashed password (use bcrypt)
- Role: ADMIN
- isActive: true

### 2. Verify Deployment

Check these URLs:

- Homepage: `https://your-domain.com`
- Login: `https://your-domain.com/login`
- Admin Dashboard: `https://your-domain.com/admin`
- API Health: `https://your-domain.com/api/health` (if you created one)
- Sitemap: `https://your-domain.com/sitemap.xml`
- Robots: `https://your-domain.com/robots.txt`

### 3. Set Up Monitoring

Consider adding:

- **Vercel Analytics** - Built-in analytics for Vercel deployments
- **Sentry** - Error tracking and monitoring
- **LogRocket** - Session replay and error tracking
- **New Relic** - Application performance monitoring

### 4. Configure Custom Domain

1. Add your custom domain in your platform's dashboard
2. Update DNS records as instructed
3. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to use your custom domain
4. Wait for DNS propagation (up to 48 hours)

### 5. Enable HTTPS

Most platforms (Vercel, Railway) automatically provide SSL certificates via Let's Encrypt.

### 6. Set Up Backups

#### Vercel Postgres

- Backups are automatic
- Point-in-time recovery available

#### Supabase

- Automatic daily backups
- Configure in Project Settings > Database > Backups

#### Railway

- Use `pg_dump` for manual backups:

  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

- Set up automated backups using Railway Cron

## Troubleshooting

### Build Fails

**Issue:** Build fails with Prisma errors

**Solution:**

```bash
# Ensure Prisma is generated during build
# Add to package.json scripts:
"postinstall": "prisma generate"
```

**Issue:** TypeScript errors during build

**Solution:**

```bash
# Run type check locally
npm run build

# Fix all type errors before deploying
```

### Database Connection Fails

**Issue:** Cannot connect to database

**Solution:**

1. Verify `DATABASE_URL` is correct
2. Check database allows external connections
3. Verify SSL mode (add `?sslmode=require` if needed)
4. Test connection locally with the production `DATABASE_URL`

### Environment Variables Not Loading

**Issue:** Environment variables are undefined

**Solution:**

1. Ensure variables are set in deployment platform
2. For `NEXT_PUBLIC_*` variables, redeploy after adding them
3. Check variable names match exactly (case-sensitive)

### NextAuth Errors

**Issue:** "Invalid callback URL" or "CSRF token mismatch"

**Solution:**

1. Ensure `NEXTAUTH_URL` matches your deployed URL exactly
2. Check that cookies are enabled
3. Verify `NEXTAUTH_SECRET` is set

### Migration Errors

**Issue:** Prisma migrations fail in production

**Solution:**

```bash
# Use db push for production if migrations are not set up
npx prisma db push

# Or run migrations explicitly
npx prisma migrate deploy
```

### Performance Issues

**Issue:** Slow page loads

**Solution:**

1. Enable Next.js Image Optimization
2. Add database connection pooling
3. Enable caching for API routes
4. Use a CDN for static assets
5. Optimize database queries with indexes

## Rollback Strategy

If a deployment fails:

### Vercel

1. Go to your project dashboard
2. Click on "Deployments"
3. Find the last working deployment
4. Click "..." > "Promote to Production"

### Railway

1. Go to your deployment history
2. Select a previous deployment
3. Click "Redeploy"

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Security Checklist

Before going to production:

- [ ] All secrets are in environment variables (not hardcoded)
- [ ] `NEXTAUTH_SECRET` is a strong, random string
- [ ] Database uses strong password
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented for API routes
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] CSRF protection (NextAuth handles this)
- [ ] Environment variables are not exposed to client
- [ ] Error messages don't leak sensitive information
- [ ] Database backups are configured

## Performance Optimization

- [ ] Enable Next.js image optimization
- [ ] Add database indexes for frequently queried fields
- [ ] Implement caching for static content
- [ ] Use ISR (Incremental Static Regeneration) where appropriate
- [ ] Optimize bundle size (check with `npm run build`)
- [ ] Enable compression
- [ ] Use CDN for static assets

## Monitoring

Set up monitoring for:

- [ ] Application errors (Sentry, LogRocket)
- [ ] Performance metrics (Vercel Analytics, Google Analytics)
- [ ] Database performance (slow query logs)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Log aggregation (Papertrail, Logtail)

## Support

For deployment issues:

- Check platform documentation (Vercel, Railway, etc.)
- Review application logs
- Test locally with production environment variables
- Contact platform support if needed

---

**Need help?** Open an issue in the GitHub repository.
