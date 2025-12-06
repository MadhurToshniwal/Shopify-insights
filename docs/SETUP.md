# Setup Instructions - Quick Start

## 🚀 Quick Setup (15 minutes)

Follow these steps to get the project running locally.

### Step 1: Install Dependencies

```bash
cd xeno-shopify-insights
npm install
```

### Step 2: Setup Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Fill in the values (see below for how to get each one).

### Step 3: Setup Database

```bash
# Push Prisma schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### Step 4: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 📝 Getting Environment Variables

### 1. DATABASE_URL (Supabase PostgreSQL)

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create account & new project
3. Go to Project Settings → Database
4. Copy "Connection string" (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

**Option B: Local PostgreSQL**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/xeno_shopify"
```

### 2. NEXTAUTH_SECRET

Generate a random secret:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output:
```
NEXTAUTH_SECRET="paste-generated-secret-here"
```

### 3. Redis (Upstash)

1. Go to https://upstash.com
2. Sign up with GitHub/Google
3. Click "Create Database"
4. Select "Regional" (free tier)
5. Click on your database
6. Scroll to "REST API" section
7. Copy both values:

```
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ=="
```

### 4. RabbitMQ (CloudAMQP)

1. Go to https://www.cloudamqp.com
2. Sign up
3. Click "Create New Instance"
4. Select "Little Lemur (Free)"
5. Choose a region
6. Create instance
7. Click on instance name
8. Copy "AMQP URL":

```
RABBITMQ_URL="amqps://username:password@jellyfish.rmq.cloudamqp.com/username"
```

### 5. Shopify Store Credentials

**A. Create Development Store**
1. Go to https://partners.shopify.com
2. Stores → Add store → Create development store
3. Fill in details, create store
4. Note your store URL: `your-store.myshopify.com`

**B. Create Custom App**
1. In your store admin: Settings → Apps and sales channels
2. Click "Develop apps"
3. Click "Allow custom app development"
4. Click "Create an app"
5. Name: "Xeno Data Sync"
6. Click "Configure Admin API scopes"
7. Select these scopes:
   - ✅ read_customers
   - ✅ read_orders
   - ✅ read_products
   - ✅ read_inventory
   - ✅ read_analytics
8. Click "Save"
9. Click "Install app"
10. Click "API credentials" tab
11. Copy these values:

```
SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
SHOPIFY_API_KEY="abc123..."
SHOPIFY_API_SECRET="shpsec_abc123..." (click "Reveal")
SHOPIFY_ACCESS_TOKEN="shpat_abc123..." (click "Reveal")
```

### 6. Email (SMTP)

**Option A: Gmail (Easiest for testing)**

1. Enable 2-Factor Authentication on your Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password
4. Use these settings:

```
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password-here"
EMAIL_FROM="noreply@yourdomain.com"
```

**Option B: SendGrid (Better for production)**

1. Sign up at https://sendgrid.com
2. Create API key
3. Use these settings:

```
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# 1. Check Prisma can connect
npx prisma db push

# 2. Start dev server
npm run dev

# 3. Open browser
# → http://localhost:3000

# 4. Test signup
# → Enter your email
# → Check email for magic link
# → Click link to sign in

# 5. Add Shopify store
# → Click "Add Store"
# → Enter your Shopify credentials
# → Watch sync happen

# 6. Check dashboard
# → Should see metrics populate
```

---

## 🐛 Troubleshooting

### Issue: "Can't reach database server"
**Solution**: Check your DATABASE_URL is correct

```bash
# Test connection
npx prisma db push
```

### Issue: "Redis connection failed"
**Solution**: Verify Upstash credentials

```bash
# Check .env file has both:
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### Issue: "Email not received"
**Solution**: 
- For Gmail: Use App Password, not regular password
- Check spam folder
- Verify EMAIL_FROM domain

### Issue: "Module not found: '@prisma/client'"
**Solution**:
```bash
npx prisma generate
npm run dev
```

### Issue: "Shopify API returns 401"
**Solution**:
- Check access token is correct
- Verify app is installed on store
- Check API scopes are granted

---

## 📦 Optional: Add Sample Data to Shopify

To test the sync, add some dummy data to your Shopify store:

1. **Products**: 
   - Go to Products → Add product
   - Create 5-10 products with different prices

2. **Customers**:
   - Go to Customers → Add customer
   - Create 5-10 customers with emails

3. **Orders**:
   - Go to Orders → Create order
   - Create orders for your dummy customers

---

## 🎯 Next Steps

After local setup works:

1. ✅ Verify all features work locally
2. ✅ Test the sync process
3. ✅ Check dashboard displays data correctly
4. ✅ Push code to GitHub
5. ✅ Deploy to Vercel (see DEPLOYMENT.md)
6. ✅ Setup production webhooks
7. ✅ Record demo video

---

## 💡 Tips

- **Development**: Use `npm run dev` and hot reload
- **Database GUI**: Use `npm run db:studio` to view data
- **Logs**: Check terminal for sync progress
- **Testing**: Add dummy data in Shopify, then click "Sync Now"

---

Need help? Check the logs or refer to the full documentation!
