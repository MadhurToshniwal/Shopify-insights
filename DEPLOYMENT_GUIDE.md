# 🚀 Deployment Guide - Vercel (Recommended)

## Why Vercel?

✅ **Best for Next.js** - Built by the Next.js team
✅ **Free Tier** - Generous limits, no credit card needed
✅ **Auto HTTPS** - Free SSL certificates
✅ **Global CDN** - Fast worldwide
✅ **Easy Setup** - Git integration, auto-deploys
✅ **Environment Variables** - Secure secret management

## Prerequisites Checklist

Before deploying, you need:

- [ ] GitHub account
- [ ] Vercel account (free - sign up with GitHub)
- [ ] Supabase account (free PostgreSQL database)
- [ ] Upstash account (free Redis)
- [ ] CloudAMQP account (free RabbitMQ)
- [ ] SendGrid account (free email sending)

## Step-by-Step Deployment

### Part 1: Prepare Database (Supabase)

1. **Go to [supabase.com](https://supabase.com)** and sign up (free)

2. **Create a new project**
   - Click "New Project"
   - Name: `xeno-shopify-prod`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to you
   - Click "Create new project" (takes ~2 mins)

3. **Get Database URL**
   - Go to Project Settings → Database
   - Find "Connection string" → "URI"
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password
   - Example: `postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres`

4. **Setup Database Schema**
   ```bash
   # In your local project
   DATABASE_URL="your-supabase-url" npm run db:push
   ```
   This creates all tables in Supabase.

### Part 2: Setup Redis (Upstash)

1. **Go to [upstash.com](https://upstash.com)** and sign up

2. **Create Redis Database**
   - Click "Create Database"
   - Name: `xeno-redis-prod`
   - Type: Regional
   - Region: Choose closest
   - Click "Create"

3. **Get Redis Credentials**
   - Go to your database → REST API tab
   - Copy:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

### Part 3: Setup RabbitMQ (CloudAMQP)

1. **Go to [cloudamqp.com](https://www.cloudamqp.com)** and sign up

2. **Create Instance**
   - Click "Create New Instance"
   - Name: `xeno-rabbitmq-prod`
   - Plan: Little Lemur (Free)
   - Region: Choose closest
   - Click "Create instance"

3. **Get Connection URL**
   - Click on your instance
   - Copy the `AMQP URL`
   - Example: `amqps://xxx:xxx@xxx.cloudamqp.com/xxx`

### Part 4: Setup SendGrid Email

You already have this! Just get your API key from SendGrid dashboard.

### Part 5: Push to GitHub

1. **Initialize Git** (if not already done)
   ```bash
   cd "d:\Xeno new\xeno-shopify-insights"
   git init
   git add .
   git commit -m "Initial commit - Xeno FDE Assignment"
   ```

2. **Create GitHub Repository**
   - Go to [github.com](https://github.com)
   - Click "+" → "New repository"
   - Name: `xeno-shopify-insights`
   - Description: "Multi-tenant Shopify data ingestion platform for Xeno FDE Internship 2025"
   - Public repository (required for submission)
   - DON'T initialize with README (you already have one)
   - Click "Create repository"

3. **Push Code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/xeno-shopify-insights.git
   git branch -M main
   git push -u origin main
   ```

### Part 6: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your `xeno-shopify-insights` repo
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add these:

   ```env
   # Database
   DATABASE_URL=your-supabase-connection-string

   # NextAuth
   NEXTAUTH_URL=https://your-app.vercel.app (you'll update this after first deploy)
   NEXTAUTH_SECRET=generate-random-secret-here

   # Redis
   UPSTASH_REDIS_REST_URL=your-upstash-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token

   # RabbitMQ
   RABBITMQ_URL=your-cloudamqp-url

   # SendGrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=your-verified-email@gmail.com

   # Shopify (optional for now - add when onboarding stores)
   SHOPIFY_STORE_DOMAIN=madhur-xeno-dev.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-access-token
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait ~2-3 minutes
   - ✅ Your app is live!

6. **Update NEXTAUTH_URL**
   - After first deploy, Vercel gives you a URL like: `https://xeno-shopify-insights.vercel.app`
   - Go to Project Settings → Environment Variables
   - Edit `NEXTAUTH_URL` to your Vercel URL
   - Redeploy (click "Redeploy" in Deployments tab)

### Part 7: Setup Database on Production

1. **Run Prisma Migration**
   - Vercel automatically runs `prisma generate` during build
   - But you need to push schema to Supabase:
   ```bash
   # On your local machine
   DATABASE_URL="your-supabase-url" npx prisma db push
   ```

2. **Create First User**
   - Visit your deployed app: `https://your-app.vercel.app`
   - Sign in with your email
   - Check your email for magic link
   - Click link to authenticate

### Part 8: Test Your Deployment

1. **Sign In**
   - Go to your Vercel URL
   - Sign in with email
   - Verify magic link works

2. **Add Shopify Store**
   - Click "Add Store" in dashboard
   - Enter your Shopify store details
   - Click "Sync Now"
   - Verify data appears

3. **Check Dashboard**
   - Metrics should show correct numbers
   - Charts should render
   - Top customers should appear

## Environment Variables Reference

### Required Variables

| Variable | Where to Get | Example |
|----------|--------------|---------|
| `DATABASE_URL` | Supabase → Settings → Database → URI | `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` |
| `NEXTAUTH_URL` | Your Vercel deployment URL | `https://xeno-shopify-insights.vercel.app` |
| `NEXTAUTH_SECRET` | Generate with crypto | `64-character-hex-string` |
| `UPSTASH_REDIS_REST_URL` | Upstash → Database → REST API | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Database → REST API | `AXX...` |
| `RABBITMQ_URL` | CloudAMQP → Instance Details | `amqps://...cloudamqp.com/...` |
| `SENDGRID_API_KEY` | SendGrid → Settings → API Keys | `SG....` |
| `EMAIL_FROM` | Your verified sender email | `your-email@gmail.com` |

### Optional Variables

| Variable | Purpose |
|----------|---------|
| `SHOPIFY_STORE_DOMAIN` | Default store for testing |
| `SHOPIFY_ACCESS_TOKEN` | Default store access token |

## Troubleshooting

### Build Fails on Vercel

**Error: `Cannot find module '@prisma/client'`**
```bash
# Add to package.json scripts:
"postinstall": "prisma generate"
```

**Error: `DATABASE_URL is required`**
- Check Environment Variables in Vercel dashboard
- Make sure DATABASE_URL is set
- Redeploy

### App Deployed but Can't Sign In

**Check:**
1. `NEXTAUTH_URL` matches your Vercel URL exactly (with https://)
2. `NEXTAUTH_SECRET` is set
3. `SENDGRID_API_KEY` is valid
4. `EMAIL_FROM` is verified in SendGrid

### Database Connection Issues

**Error: `Can't reach database server`**
- Check Supabase database is running
- Check DATABASE_URL is correct
- Make sure IP is allowed (Supabase allows all by default)

### Redis Connection Issues

**Error: `Redis connection failed`**
- Check Upstash database is active
- Check URL and TOKEN are correct
- Make sure you're using REST API credentials (not TCP)

## Post-Deployment Checklist

- [ ] App loads at Vercel URL
- [ ] Sign-in works (magic link received)
- [ ] Can access dashboard after sign-in
- [ ] Can add new tenant/store
- [ ] Can sync data from Shopify
- [ ] Metrics display correctly
- [ ] Charts render properly
- [ ] No console errors

## Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Project Settings → Domains
2. Click "Add"
3. Enter your domain (e.g., `xeno-shopify.yourdomain.com`)
4. Follow DNS setup instructions
5. Update `NEXTAUTH_URL` to new domain

## Updating After Deployment

**Automatic Deploys:**
Every time you push to `main` branch on GitHub, Vercel automatically:
1. Pulls latest code
2. Runs build
3. Deploys new version

**Manual Redeploy:**
- Go to Vercel → Your Project → Deployments
- Click "..." on any deployment
- Click "Redeploy"

## Cost Breakdown (All Free!)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Vercel | Hobby | FREE | 100GB bandwidth/month |
| Supabase | Free | FREE | 500MB database |
| Upstash | Free | FREE | 10K commands/day |
| CloudAMQP | Little Lemur | FREE | 1 million messages/month |
| SendGrid | Free | FREE | 100 emails/day |

**Total Cost: $0/month** 🎉

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test thoroughly
3. 📹 Record demo video showing deployed app
4. 📝 Update README with live URL
5. 🚀 Submit assignment!

## Support

If you encounter issues:
- Check Vercel build logs
- Check browser console for errors
- Check Supabase logs for database errors
- Verify all environment variables are set correctly

Good luck! 🚀
