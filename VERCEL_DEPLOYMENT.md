# 🚀 Vercel Deployment - Quick Guide

## ✅ Your Code is Ready!

✅ **GitHub:** https://github.com/MadhurToshniwal/Shopify-insights  
✅ **Local Server Running:** http://localhost:3000  
✅ **All Files Committed:** No secrets in repo

---

## 🎯 Deploy in 3 Steps (30 minutes total)

### Step 1: Setup Free Services (20 min)

#### A. Supabase (PostgreSQL Database)
1. Go to [supabase.com](https://supabase.com) → Sign in with GitHub
2. Click **"New Project"**
   - Name: `xeno-shopify`
   - Password: Create strong password (SAVE IT!)
   - Region: Closest to you
3. Wait 2 minutes for setup
4. Go to **Settings** → **Database** → **Connection String** → **URI**
5. Copy the URL (looks like: `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`)
6. **SAVE AS:** `DATABASE_URL`

#### B. Upstash (Redis Cache)
1. Go to [console.upstash.com](https://console.upstash.com) → Sign in with GitHub
2. Click **"Create Database"**
   - Name: `xeno-redis`
   - Type: Regional
   - Region: Closest to you
3. Click your database → **REST API** tab
4. **COPY THESE:**
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=Axxx...==
   ```

#### C. CloudAMQP (RabbitMQ)
1. Go to [cloudamqp.com](https://www.cloudamqp.com) → Sign up
2. Click **"Create New Instance"**
   - Name: `xeno-rabbitmq`
   - Plan: **Little Lemur (FREE)**
   - Region: Closest to you
3. Click instance name → Copy **AMQP URL**
4. **SAVE AS:** `RABBITMQ_URL`

---

### Step 2: Deploy to Vercel (5 min)

1. **Go to [vercel.com](https://vercel.com)** → Continue with GitHub

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Find: `Shopify-insights`
   - Click **"Import"**

3. **Don't change any settings yet** → Click **"Deploy"**
   - It will fail (expected!) - we need environment variables

4. **Add Environment Variables:**
   - After deploy fails, go to **Settings** → **Environment Variables**
   - Add these:

   ```env
   # Database (from Supabase Step 1A)
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xxx.supabase.co:5432/postgres
   
   # Auth (generate NEXTAUTH_SECRET below)
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=
   
   # Email (you already have SendGrid setup)
   EMAIL_SERVER_HOST=smtp.sendgrid.net
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=apikey
   EMAIL_SERVER_PASSWORD=SG.YOUR_SENDGRID_KEY
   EMAIL_FROM=madhurtoshniwal03@gmail.com
   
   # Redis (from Upstash Step 1B)
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=Axxx...==
   
   # RabbitMQ (from CloudAMQP Step 1C)
   RABBITMQ_URL=amqps://xxx:yyy@rabbit.rmq.cloudamqp.com/zzz
   ```

5. **Generate NEXTAUTH_SECRET:**
   ```powershell
   # Run this in PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```
   Copy the output and paste as `NEXTAUTH_SECRET` value

6. **Redeploy:**
   - Go to **Deployments** → Click latest
   - Click **"..."** → **"Redeploy"**
   - Wait ~2 minutes

7. **Update NEXTAUTH_URL:**
   - Copy your Vercel URL (e.g., `shopify-insights-abc.vercel.app`)
   - Go to **Settings** → **Environment Variables**
   - Edit `NEXTAUTH_URL` → Set to `https://shopify-insights-abc.vercel.app`
   - **Redeploy again**

---

### Step 3: Setup Production Database (5 min)

Run this locally to push schema to Supabase:

```powershell
cd "d:\Xeno new\xeno-shopify-insights"

# Set production DB URL (use your Supabase URL from Step 1A)
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Push schema to production
npx prisma db push

# Verify (optional)
npx prisma studio
```

---

## 🧪 Test Your Deployment

1. Open: `https://your-app.vercel.app`
2. Click **"Sign In"** → Enter `madhurtoshniwal03@gmail.com`
3. Check email for magic link → Click it
4. Dashboard should load
5. Click **"Add Store"**:
   - Domain: `your-store.myshopify.com`
   - Token: `shpat_YOUR_ACCESS_TOKEN` (from Shopify Admin)
6. Click **"Sync Data"**
7. Should show: 2 customers, 1 order, ₹1,088.91

---

## 🐛 Common Issues

### Build Fails
**Error:** Type errors during build  
**Fix:** Check Vercel logs → Usually missing env vars

### Can't Sign In
**Error:** Keeps redirecting to sign-in page  
**Fix:** 
- Verify `NEXTAUTH_URL` matches exact Vercel URL
- Verify `NEXTAUTH_SECRET` is set

### Database Connection Error
**Error:** Can't connect to database  
**Fix:**
- Check `DATABASE_URL` is correct
- Supabase project might be paused (free tier auto-pauses)

### Metrics Show Zero
**Fix:** Click "Sync Data" button - Redis cache is empty initially

---

## 📊 View Logs

- **Vercel Dashboard** → Your Project → **Deployments**
- Click latest deployment → **"View Function Logs"**
- Check for errors during API calls

---

## 💰 Cost Breakdown

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth | **$0** |
| Supabase | 500MB database | **$0** |
| Upstash | 10K commands/day | **$0** |
| CloudAMQP | 1M messages/month | **$0** |
| SendGrid | 100 emails/day | **$0** |
| **TOTAL** | | **$0** ✅ |

---

## ✅ Final Checklist

- [ ] Supabase database created
- [ ] Upstash Redis created  
- [ ] CloudAMQP RabbitMQ created
- [ ] All env vars added to Vercel
- [ ] Deployed successfully (green checkmark)
- [ ] Can sign in with email
- [ ] Dashboard loads
- [ ] Sync data works
- [ ] Metrics display correctly

---

## 🎬 Next Steps

1. **Update README.md** with your Vercel URL
2. **Record Demo Video** (see `DEMO_VIDEO_SCRIPT.md`)
3. **Submit Assignment:**
   - ✅ GitHub: https://github.com/MadhurToshniwal/Shopify-insights
   - ✅ Vercel: https://your-app.vercel.app
   - ⏳ Video: [Upload to YouTube]

---

## 🆘 Need Help?

Check the detailed guide: `DEPLOYMENT_GUIDE.md` in this repo for:
- Troubleshooting steps
- Screenshots
- Security best practices
- Monitoring tips

---

**You're almost done! Just follow these 3 steps and your app will be live! 🚀**
