# 🎬 Demo Video Script (7 Minutes Max)

## Video Structure

**Total Duration:** 6-7 minutes
**Format:** Screen recording + webcam (your face visible)
**Tool:** Loom (free) or OBS Studio

## Introduction (30 seconds)

**[Show your face on camera]**

"Hi! I'm [Your Name], and this is my submission for the Xeno Forward Deployed Engineer Internship Assignment 2025.

I've built a production-ready, multi-tenant Shopify data ingestion and analytics platform that demonstrates real-world enterprise engineering.

Let me walk you through the architecture, features, and my engineering decisions."

## Part 1: Architecture Overview (1 minute)

**[Screen: Show ARCHITECTURE.md diagram]**

"The system follows a modern microservices architecture:

1. **Frontend:** Next.js 14 with React Server Components for fast, SEO-friendly pages
2. **Backend:** Next.js API routes handling authentication, data sync, and analytics
3. **Database:** PostgreSQL with Prisma ORM for type-safe database access
4. **Caching:** Redis for sub-second dashboard load times
5. **Async Processing:** RabbitMQ for scalable background jobs
6. **External Integration:** Shopify Admin API for real-time data sync

The key design decision here was **multi-tenancy** - every table has a tenant identifier, ensuring complete data isolation between different Shopify stores."

## Part 2: Live Demo - Authentication (30 seconds)

**[Screen: Show deployed app]**

"Let's start with authentication. I implemented passwordless email authentication using NextAuth.js and SendGrid.

**[Type email, click Sign In]**

When I enter my email and click sign in, I receive a magic link...

**[Show email inbox]**

Here's the email. I click the link...

**[Click link, show redirect to dashboard]**

And I'm securely authenticated and redirected to the dashboard."

## Part 3: Live Demo - Dashboard & Analytics (2 minutes)

**[Screen: Dashboard loaded]**

"This is the main dashboard showing real-time analytics from my Shopify store.

**Top Metrics:**
- We have 2 total customers
- 1 order processed
- Total revenue of ₹1,088.91
- Average order value matches since we have one order

**[Point to growth metrics]**

These percentages show growth compared to the previous 30-day period.

**[Scroll to Revenue Chart]**

This chart visualizes revenue over time. I'm using Recharts library for interactive, responsive data visualization.

**[Scroll to Top Customers]**

Here are the top 5 customers by total spend. Currently showing Rohit who placed that ₹1,088 order.

**[Click on different dates/filters if you added them]**

The dashboard supports date range filtering for historical analysis."

## Part 4: Live Demo - Multi-Tenancy (1 minute)

**[Screen: Tenant dropdown/selector]**

"Now, the killer feature - **multi-tenancy**.

**[Click Add Store button]**

I can add multiple Shopify stores to the same platform. Each store is a separate tenant with completely isolated data.

**[Show tenant form]**

I enter the Shopify store domain and access token...

**[Fill form, click Add]**

And the system creates a new tenant, establishes the connection, and I can switch between stores using this dropdown.

**[Point to tenant selector]**

This demonstrates how Xeno could onboard hundreds of retail clients onto a single platform."

## Part 5: Data Sync Demonstration (1 minute)

**[Screen: Dashboard with Sync Now button]**

"Let me show you the data synchronization in action.

**[Click Sync Now]**

When I click Sync Now, the system:
1. Connects to Shopify Admin API
2. Fetches customers, orders, and products
3. Stores them in PostgreSQL with proper tenant isolation
4. Updates the dashboard in real-time

**[Show loading state, then updated data]**

You can see the sync completed. The system pulled 17 products, 2 customers, and 1 order from my Shopify development store.

**[Point to Last Synced timestamp]**

We track the last sync time for each tenant."

## Part 6: Engineering Approach & Trade-offs (1.5 minutes)

**[Switch to your face/picture-in-picture mode]**

"Let me explain my engineering approach and key decisions:

**1. Type Safety Everywhere**
I chose TypeScript with Prisma because it catches errors at compile time. Every database query is type-checked, eliminating an entire class of runtime bugs.

**2. Caching Strategy**
I implemented Redis caching with a 5-minute TTL for analytics. This reduced dashboard load time from ~500ms to under 50ms - a 10x improvement.

**3. Async Architecture**
While the current demo uses direct API calls, I built in RabbitMQ support for async processing. This means when we scale to thousands of stores, each sync job runs independently without blocking the UI.

**Trade-offs I made:**

- **Incremental vs Full Sync:** I chose incremental sync with deduplication. It's slower initially but scales better.
- **Webhooks vs Polling:** I built webhook endpoints but kept manual sync for the demo. In production, webhooks would update data in real-time.
- **Caching TTL:** 5 minutes balances freshness vs performance. For real-time dashboards, I'd use Redis pub/sub.

**4. Database Schema**
I designed 13 normalized tables with proper foreign keys. The tenant ID is in every table's composite unique constraint, ensuring data can never leak between tenants."

## Part 7: Code Quality Highlights (30 seconds)

**[Screen: Show folder structure briefly]**

"Quick code walkthrough:

- **Services Layer:** Clean separation - analytics, sync, Shopify client
- **Error Handling:** Try-catch everywhere with detailed logging
- **Sync Logs:** Every sync is audited in the database
- **Reusable Components:** MetricCard, RevenueChart, TopCustomers
- **Environment Config:** All secrets in environment variables, never committed

The entire codebase is production-ready with comprehensive documentation."

## Conclusion (30 seconds)

**[Show your face full screen]**

"To summarize what I built:

✅ Multi-tenant Shopify data platform
✅ Real-time analytics dashboard
✅ Scalable architecture with caching and queues
✅ Type-safe, production-ready code
✅ Deployed live on Vercel

**What I'd do next to productionize:**
1. Add webhook event processing for real-time updates
2. Implement rate limiting and request retry logic
3. Add comprehensive monitoring and alerts
4. Build admin dashboard for platform management

This project demonstrates my ability to:
- Integrate complex third-party APIs
- Design scalable multi-tenant architectures
- Make pragmatic engineering trade-offs
- Deliver production-quality code

Thank you for reviewing my submission. I'm excited about the opportunity to join Xeno as a Forward Deployed Engineer!

The full code is on GitHub, live demo is at [your-vercel-url], and all documentation is in the README.

Questions? I'm available at [your-email]."

**[Wave, smile, end recording]**

---

## Recording Checklist

Before you record:

- [ ] Test deployed app thoroughly
- [ ] Prepare demo data (customers, orders, products)
- [ ] Close unnecessary browser tabs
- [ ] Close Slack/Discord/distractions
- [ ] Use incognito mode for clean demo
- [ ] Test microphone and camera
- [ ] Rehearse once to stay within 7 minutes

During recording:

- [ ] Speak clearly and confidently
- [ ] Don't rush - 7 minutes is plenty
- [ ] Show your face (builds connection)
- [ ] Smile and be enthusiastic
- [ ] Point to important things on screen
- [ ] Explain *why* you made decisions

After recording:

- [ ] Watch it once to catch errors
- [ ] Add captions if possible (accessibility++)
- [ ] Upload to YouTube (unlisted or public)
- [ ] Add to README and submission form

## Recording Tools (Free)

**Recommended: Loom**
- Free tier: 5-minute videos (you'll need paid for 7 min)
- Or use Loom free trial (14 days)
- Easy editing and sharing

**Alternative: OBS Studio**
- Completely free
- More complex setup
- Professional quality
- Export to MP4, upload to YouTube

**Quick Option: Zoom**
- Record yourself in a Zoom meeting
- Share screen
- Free tier allows 40-min recordings
- Download and upload to YouTube

## YouTube Upload Settings

- Title: "Xeno FDE Internship 2025 - Multi-Tenant Shopify Platform - [Your Name]"
- Description: Link to GitHub repo, deployed app, brief summary
- Visibility: Unlisted (or Public if you want it on your portfolio)
- Add to playlist: "Projects" or "Portfolio"

Good luck! 🎬
