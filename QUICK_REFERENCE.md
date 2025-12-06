# Quick Reference - Commands & URLs

## Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npm run db:push

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View database
npm run db:studio

# Format code
npm run lint
```

## Important URLs

### Local Development
- **App**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Prisma Studio**: http://localhost:5555 (after running `npm run db:studio`)

### API Endpoints
- `POST /api/auth/signin` - Email sign in
- `GET /api/tenants` - List user's stores
- `POST /api/tenants` - Add new store
- `POST /api/tenants/[id]/sync` - Trigger sync
- `GET /api/analytics/[id]` - Get analytics data
- `POST /api/webhooks/shopify` - Shopify webhook handler

### External Services
- **Supabase**: https://supabase.com/dashboard
- **Upstash Redis**: https://console.upstash.com
- **CloudAMQP**: https://customer.cloudamqp.com
- **Shopify Partners**: https://partners.shopify.com
- **Vercel**: https://vercel.com/dashboard

## Project Structure

```
xeno-shopify-insights/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # NextAuth
│   │   ├── tenants/            # Tenant management
│   │   ├── analytics/          # Analytics data
│   │   └── webhooks/           # Shopify webhooks
│   ├── auth/                   # Auth pages
│   ├── dashboard/              # Dashboard page
│   └── page.tsx                # Home (redirects)
├── components/                 # React components
│   ├── MetricCard.tsx
│   ├── RevenueChart.tsx
│   ├── TopCustomers.tsx
│   └── TenantModal.tsx
├── lib/                        # Core libraries
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client
│   ├── redis.ts                # Redis client
│   ├── rabbitmq.ts             # RabbitMQ client
│   ├── shopify.ts              # Shopify API client
│   ├── services/
│   │   ├── sync.service.ts     # Data sync logic
│   │   └── analytics.service.ts # Analytics calculations
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
├── docs/                       # Documentation
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
└── NEXT_STEPS.md              # What to do now
```

## Environment Variables Quick Check

```bash
# Check if all required vars are set
cat .env | grep -E "DATABASE_URL|NEXTAUTH_SECRET|UPSTASH|RABBITMQ"
```

## Common Tasks

### Add New Shopify Store
1. Sign in to app
2. Click "Add Store"
3. Enter store domain, access token
4. Click "Add Store"
5. Sync starts automatically

### View Synced Data
```bash
# Open Prisma Studio
npm run db:studio

# Navigate to tables:
# - customers
# - orders
# - products
```

### Trigger Manual Sync
1. Open dashboard
2. Select store from dropdown
3. Click "Sync Now" button
4. Wait for completion

### Check Sync Logs
```bash
# View in Prisma Studio
npm run db:studio

# Go to sync_logs table
```

### Setup Webhooks (After Deployment)
1. Deploy to Vercel
2. Copy deployed URL
3. Go to Shopify Admin → Settings → Apps → Your App
4. Add webhook: `https://your-domain.vercel.app/api/webhooks/shopify`
5. Select topics: customers/*, orders/*, products/*

## Debugging

### Database Connection Issues
```bash
# Test connection
npx prisma db push

# If fails, check:
# 1. DATABASE_URL is correct
# 2. Database is accessible
# 3. Credentials are valid
```

### Prisma Client Not Found
```bash
# Regenerate Prisma client
npx prisma generate
```

### Redis Connection Error
```bash
# Check .env has both:
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

### Email Not Sending
```bash
# For Gmail:
# 1. Enable 2FA
# 2. Generate App Password
# 3. Use App Password in EMAIL_SERVER_PASSWORD
```

## Testing Checklist

Before deployment:

- [ ] Can sign in with email
- [ ] Can add Shopify store
- [ ] Initial sync completes
- [ ] Dashboard shows data
- [ ] Metrics calculate correctly
- [ ] Charts render properly
- [ ] Top customers display
- [ ] Manual sync works
- [ ] Multi-store switching works

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All env vars added to Vercel
- [ ] Database migrations run
- [ ] Production build succeeds
- [ ] App accessible at Vercel URL
- [ ] Shopify webhooks configured
- [ ] End-to-end test passes

## Demo Video Outline

1. **Intro** (1 min)
   - Who you are
   - What you built
   - Tech stack overview

2. **Architecture** (1 min)
   - Show diagram
   - Explain flow
   - Highlight multi-tenancy

3. **Live Demo** (2 min)
   - Sign in
   - Add store
   - Show sync
   - Display analytics

4. **Code Walkthrough** (2 min)
   - Database schema
   - Sync service
   - Webhook handler
   - Caching layer

5. **Conclusion** (1 min)
   - Key features
   - Production readiness
   - Thank you

## Submission Items

Submit these to Xeno:

1. ✅ GitHub repository URL
2. ✅ Deployed Vercel URL
3. ✅ Demo video (YouTube/Loom)
4. ✅ README with setup instructions

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Shopify API**: https://shopify.dev/docs/api
- **NextAuth**: https://next-auth.js.org
- **Tailwind**: https://tailwindcss.com/docs

---

**Quick Help**: Check NEXT_STEPS.md for detailed instructions!
