# Deployment Guide - Xeno Shopify Insights

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Vercel account (free tier is fine)
- [ ] GitHub repository with your code
- [ ] Supabase PostgreSQL database created
- [ ] Upstash Redis instance created
- [ ] CloudAMQP RabbitMQ instance created
- [ ] Shopify development store with API credentials
- [ ] SMTP credentials for email authentication (Gmail, SendGrid, etc.)

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Xeno Shopify Insights"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/xeno-shopify-insights.git

# Push to GitHub
git push -u origin main
```

### 2. Database Setup (Supabase)

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for database to provision
4. Go to Project Settings → Database
5. Copy the connection string (URI format)
6. Save as `DATABASE_URL`

### 3. Deploy to Vercel

#### Option A: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

4. Add Environment Variables (see below)
5. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

### 4. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

#### Database
```
DATABASE_URL=postgresql://user:pass@host:port/db?pgbouncer=true
```

#### NextAuth
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

#### Shopify (Optional - users can add via UI)
```
SHOPIFY_API_KEY=<your-api-key>
SHOPIFY_API_SECRET=<your-api-secret>
```

#### Redis (Upstash)
```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

#### RabbitMQ (CloudAMQP)
```
RABBITMQ_URL=amqps://user:pass@host/vhost
```

#### Email (SMTP)
For Gmail:
```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=<app-specific-password>
EMAIL_FROM=noreply@yourdomain.com
```

For SendGrid:
```
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=<your-sendgrid-api-key>
EMAIL_FROM=noreply@yourdomain.com
```

### 5. Run Database Migrations

After deployment, you need to push the Prisma schema:

```bash
# Option 1: Use Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option 2: Run directly (if DATABASE_URL is in local .env)
npx prisma db push
```

### 6. Setup Shopify Webhooks

After deployment:

1. Go to your Shopify store admin
2. Settings → Apps and sales channels → Develop apps → Your app
3. Configuration → Webhooks
4. Add these webhook subscriptions:

| Event | Address |
|-------|---------|
| `customers/create` | `https://your-domain.vercel.app/api/webhooks/shopify` |
| `customers/update` | `https://your-domain.vercel.app/api/webhooks/shopify` |
| `orders/create` | `https://your-domain.vercel.app/api/webhooks/shopify` |
| `orders/updated` | `https://your-domain.vercel.app/api/webhooks/shopify` |
| `products/create` | `https://your-domain.vercel.app/api/webhooks/shopify` |
| `products/update` | `https://your-domain.vercel.app/api/webhooks/shopify` |

### 7. Verify Deployment

1. Visit your deployed URL
2. Sign in with email
3. Add your Shopify store
4. Trigger a sync
5. Check dashboard for data

## Troubleshooting

### Build Errors

**Error**: `Prisma Client not generated`
```bash
# Solution: Add postinstall script
npm run postinstall
```

**Error**: `Module not found: Can't resolve '@prisma/client'`
```bash
# Solution: Regenerate Prisma client
npx prisma generate
```

### Runtime Errors

**Error**: `P1001: Can't reach database server`
- Check DATABASE_URL format
- Ensure IP is whitelisted in Supabase

**Error**: `NextAuth email verification failed`
- Check SMTP credentials
- For Gmail, use App Password (not regular password)

**Error**: `Redis connection failed`
- Verify UPSTASH_REDIS_REST_URL and TOKEN
- Check if Upstash instance is active

### Webhook Issues

**Webhooks not received**
- Verify webhook URL is correct
- Check Shopify webhook logs
- Ensure your app is installed on the store

**HMAC verification failed**
- Check SHOPIFY_API_SECRET matches your app
- Verify webhook is from correct store

## Performance Optimization

### 1. Enable Vercel Edge Caching
```typescript
// In API routes
export const config = {
  runtime: 'edge',
};
```

### 2. Optimize Database Queries
```bash
# Generate Prisma client with optimization
npx prisma generate --data-proxy
```

### 3. Monitor Performance
- Enable Vercel Analytics
- Check Vercel Logs for errors
- Monitor Supabase dashboard for slow queries

## Security Checklist

- [ ] All environment variables are in Vercel (not in code)
- [ ] NEXTAUTH_SECRET is strong and random
- [ ] Database connection uses SSL
- [ ] Webhook HMAC verification is enabled
- [ ] API routes check authentication
- [ ] CORS is properly configured

## Post-Deployment

### 1. Test End-to-End Flow
- [ ] User signup works
- [ ] Email magic link received
- [ ] Can add Shopify store
- [ ] Initial sync completes
- [ ] Dashboard shows data
- [ ] Manual sync works
- [ ] Webhooks process correctly

### 2. Monitor
- Check Vercel deployment logs
- Monitor Supabase for queries
- Check Redis hit rate
- Review RabbitMQ queue status

### 3. Document
- Note your deployment URL
- Save credentials securely
- Update README with deployed link

## Cost Estimate (Free Tier)

- **Vercel**: Free (Hobby plan)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **Upstash Redis**: Free (10K commands/day)
- **CloudAMQP**: Free (Little Lemur plan)
- **Domain**: Optional ($10-15/year)

**Total**: $0/month (within free tier limits)

## Scaling Considerations

When you exceed free tier limits:

1. **Database**: Upgrade Supabase to Pro ($25/month)
2. **Redis**: Upgrade Upstash based on usage
3. **RabbitMQ**: Upgrade CloudAMQP to Tough Tiger ($19/month)
4. **Vercel**: Stay on Hobby or upgrade to Pro ($20/month)

## Support

If deployment fails:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test locally first with `npm run build`
4. Review Prisma connection string format

---

Good luck with your deployment! 🚀
