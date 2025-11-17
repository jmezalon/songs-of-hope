# Environment Variables Guide

This guide explains all environment variables used in the Chant d'Espérance platform.

## Required Variables

### DATABASE_URL

**Description:** PostgreSQL database connection string

**Format:** `postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public`

**Examples:**

```bash
# Local development
DATABASE_URL="postgresql://postgres:password@localhost:5432/chant_esperance_db?schema=public"

# Vercel Postgres (automatically provided)
DATABASE_URL="postgres://default:xxxxx@xx-xx-xx-pooler.aws.neon.tech/verceldb?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Railway (automatically provided)
DATABASE_URL="postgresql://postgres:xxxxx@containers-us-west-xx.railway.app:5432/railway"
```

**Security Notes:**
- Never commit this to version control
- Use SSL mode in production: `?sslmode=require`
- Ensure your database allows connections from your hosting platform's IP range

---

### NEXTAUTH_URL

**Description:** The canonical URL of your application

**Format:** Full URL including protocol

**Examples:**

```bash
# Development
NEXTAUTH_URL="http://localhost:3000"

# Production with custom domain
NEXTAUTH_URL="https://chantdesperance.com"

# Production on Vercel
NEXTAUTH_URL="https://your-project.vercel.app"
```

**Important:**
- Must match the URL users access your site from
- Include `https://` in production
- No trailing slash
- Update this when deploying to production or changing domains

---

### NEXTAUTH_SECRET

**Description:** Secret key used to encrypt JWT tokens and sign cookies

**Format:** Random string (minimum 32 characters recommended)

**Generate:**

```bash
openssl rand -base64 32
```

**Example output:**

```bash
NEXTAUTH_SECRET="dGhpc2lzYXZlcnlsb25nc2VjcmV0a2V5Zm9ybmV4dGF1dGg="
```

**Security Notes:**
- MUST be different between development and production
- MUST be kept secret
- Never share or commit to version control
- Changing this will invalidate all existing sessions
- Store securely in your deployment platform's environment variables

---

### NEXT_PUBLIC_APP_URL

**Description:** Public URL of the application (used for SEO, sitemap, metadata)

**Format:** Full URL including protocol

**Examples:**

```bash
# Development
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Production
NEXT_PUBLIC_APP_URL="https://chantdesperance.com"
```

**Note:**
- This is a public variable (exposed to the browser)
- Should match `NEXTAUTH_URL`
- Used in meta tags, OpenGraph, sitemap generation

---

## Optional Variables

### Email Configuration (Future Feature)

For sending password reset emails, notifications, etc.

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="noreply@chantdesperance.com"
```

### Search Configuration (Future Feature)

For Typesense full-text search integration:

```bash
TYPESENSE_HOST="xxx.a1.typesense.net"
TYPESENSE_PORT="443"
TYPESENSE_PROTOCOL="https"
TYPESENSE_API_KEY="your-search-only-api-key"
```

### File Storage (Future Feature)

For uploading sheet music, audio files, etc.

**AWS S3:**

```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="chant-esperance-media"
```

**Cloudinary:**

```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Analytics & Monitoring

**Google Analytics:**

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**Sentry (Error Tracking):**

```bash
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
SENTRY_ORG="your-organization"
SENTRY_PROJECT="your-project"
```

---

## Setting Environment Variables

### Local Development

1. Create `.env` file in project root:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values

3. Restart your development server

### Vercel

**Via Dashboard:**

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - Name: `DATABASE_URL`
   - Value: Your database connection string
   - Environments: Production, Preview, Development

**Via CLI:**

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### Railway

1. Go to your project
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable

### Docker

Create a `.env.production` file:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://...
NEXTAUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://...
```

Run with:

```bash
docker run --env-file .env.production your-image
```

---

## Validation Checklist

Use this checklist to ensure all variables are correctly set:

### Development

- [ ] `.env` file exists in project root
- [ ] `.env` is in `.gitignore`
- [ ] `DATABASE_URL` points to local PostgreSQL database
- [ ] `NEXTAUTH_URL` is `http://localhost:3000`
- [ ] `NEXTAUTH_SECRET` is set (any value for dev)
- [ ] `NEXT_PUBLIC_APP_URL` is `http://localhost:3000`
- [ ] Can connect to database: `npx prisma db pull`
- [ ] Can login to the application

### Production

- [ ] All required variables are set in deployment platform
- [ ] `DATABASE_URL` uses production database
- [ ] `DATABASE_URL` includes `?sslmode=require`
- [ ] `NEXTAUTH_URL` uses `https://` and matches deployed domain
- [ ] `NEXTAUTH_SECRET` is cryptographically secure and different from dev
- [ ] `NEXT_PUBLIC_APP_URL` matches deployed domain
- [ ] No secrets are hardcoded in the codebase
- [ ] Environment variables are not exposed in client-side code
- [ ] Can login to deployed application
- [ ] Check `/api/auth/providers` returns correct data

---

## Troubleshooting

### "Invalid callback URL" Error

**Cause:** `NEXTAUTH_URL` doesn't match the URL you're accessing the site from

**Solution:**

1. Check `NEXTAUTH_URL` matches your domain exactly
2. Include protocol (`http://` or `https://`)
3. Remove any trailing slash
4. Redeploy after changing

### Database Connection Failed

**Cause:** Incorrect `DATABASE_URL` or network issues

**Solution:**

1. Verify connection string format
2. Check username, password, host, and port
3. Ensure database allows external connections
4. Add `?sslmode=require` for cloud databases
5. Check firewall rules
6. Test connection: `npx prisma db pull`

### Environment Variables Not Loading

**Cause:** Variables not properly set or need restart

**Solution:**

1. Verify variables are set in deployment platform
2. For `NEXT_PUBLIC_*` variables, rebuild is required
3. Restart development server
4. Check variable names (case-sensitive)
5. Ensure no spaces around `=` in `.env` file

### CSRF Token Mismatch

**Cause:** `NEXTAUTH_URL` or `NEXTAUTH_SECRET` issues

**Solution:**

1. Ensure `NEXTAUTH_URL` is correct
2. Clear cookies and try again
3. Verify `NEXTAUTH_SECRET` is set
4. Check browser console for errors

---

## Security Best Practices

1. **Never commit `.env` files**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` as a template

2. **Use strong secrets**
   - Generate with `openssl rand -base64 32`
   - Different secrets for dev and production
   - Rotate secrets periodically

3. **Limit access**
   - Only give team members access to secrets they need
   - Use secret management tools (Vercel, Railway, AWS Secrets Manager)

4. **Regular audits**
   - Review who has access to environment variables
   - Check for any accidentally committed secrets
   - Use tools like `git-secrets` to prevent commits

5. **Backup variables**
   - Keep a secure backup of production environment variables
   - Document all variables and their purposes

---

## Additional Resources

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
