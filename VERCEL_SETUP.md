# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings (Settings → Environment Variables):

### NEXT_PUBLIC_APP_URL
**Value**: Your production domain (e.g., `https://chant-desperance.org`)
**Environment**: Production, Preview, Development

This is used for:
- SEO metadata (OpenGraph, Twitter cards)
- Sitemap generation
- Canonical URLs

### How to Add:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `NEXT_PUBLIC_APP_URL` with your production domain
4. Save and redeploy

**Note**: If not set, the app will fall back to `VERCEL_URL` (automatically provided by Vercel), but it's better to explicitly set your custom domain.

## Other Required Variables

Make sure you also have these set in Vercel (from your `.env` file):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production domain

## Testing Twitter Cards

After deploying, test your Twitter cards using:
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- OpenGraph Debugger: https://www.opengraph.xyz/
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
