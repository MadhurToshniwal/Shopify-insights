# Architecture Documentation

## System Overview

Xeno Shopify Insights is a multi-tenant SaaS platform that ingests and analyzes Shopify store data. It follows a microservices-inspired architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Dashboard  │  │ Tenant Setup │  │    Auth      │         │
│  │   (React)    │  │   (React)    │  │  (NextAuth)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────────┐
│                      API LAYER (Next.js)                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  /api/auth/[...nextauth]   - Authentication            │     │
│  │  /api/tenants              - Tenant management         │     │
│  │  /api/analytics/[id]       - Analytics data            │     │
│  │  /api/webhooks/shopify     - Shopify webhook handler   │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────┬───────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   SyncService    │  │ AnalyticsService │                    │
│  │  - fullSync()    │  │ - getMetrics()   │                    │
│  │  - syncCustomers │  │ - getTopCustomers│                    │
│  │  - syncOrders    │  │ - getRevenue()   │                    │
│  │  - syncProducts  │  │ - calculateLTV() │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
└───────────┼──────────────────────┼───────────────────────────────┘
            │                      │
┌───────────▼──────────────────────▼───────────────────────────────┐
│                    INTEGRATION LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Shopify    │  │   Prisma    │  │   Redis     │            │
│  │   Client    │  │    ORM      │  │   Cache     │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                 │                    │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐            │
│  │  RabbitMQ   │  │ PostgreSQL  │  │   Upstash   │            │
│  │ (CloudAMQP) │  │  (Supabase) │  │   (Redis)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Onboarding
```
User → Sign In Page → NextAuth → Email Magic Link → Dashboard
```

### 2. Tenant Setup
```
User → Add Store Form → POST /api/tenants → Create Tenant → Trigger Full Sync
                                              ↓
                                         RabbitMQ Queue
                                              ↓
                                      Background Worker
                                              ↓
                                    Shopify API Calls
                                              ↓
                                      PostgreSQL Write
```

### 3. Data Sync Flow
```
Shopify Admin → Webhook Event → POST /api/webhooks/shopify
                                         ↓
                                 Verify HMAC Signature
                                         ↓
                                 Store in webhook_events
                                         ↓
                                 Process Immediately
                                         ↓
                                 Upsert to Database
                                         ↓
                                 Invalidate Cache
```

### 4. Analytics Request
```
Dashboard → GET /api/analytics/[id] → Check Redis Cache
                                            ↓
                                       Cache Hit?
                                       ↙        ↘
                                    Yes         No
                                     ↓           ↓
                              Return Cached   Query DB
                                              ↓
                                         Calculate Metrics
                                              ↓
                                          Cache Result
                                              ↓
                                         Return Data
```

## Database Design

### Multi-Tenancy Strategy
- **Row-Level Isolation**: All data tables include `tenantId` foreign key
- **Composite Unique Constraints**: Ensure data uniqueness per tenant
- **Indexes**: Optimized queries with tenant-based indexes

### Key Relationships
```
User ←→ TenantUser ←→ Tenant
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    Customer         Order          Product
        ↑               ↓
        └──────────────┘
```

## Caching Strategy

### Cache Layers
1. **Application Cache (Redis)**
   - Tenant metrics (5 min TTL)
   - Chart data (10 min TTL)
   - Top customers (5 min TTL)

2. **Database Cache (Prisma)**
   - Connection pooling
   - Query result caching

### Cache Invalidation
- Time-based expiration (TTL)
- Manual invalidation on sync operations
- Event-driven invalidation on webhooks

## Security Architecture

### Authentication
- **Method**: Email magic links (passwordless)
- **Session**: JWT-based sessions via NextAuth
- **Storage**: Database sessions with Prisma adapter

### Authorization
- **Model**: Role-based access control (RBAC)
- **Roles**: owner, admin, viewer
- **Enforcement**: Middleware checks on API routes

### Data Security
- **Encryption**: TLS in transit, encryption at rest (DB level)
- **Webhook Verification**: HMAC-SHA256 signature validation
- **API Keys**: Encrypted storage in database
- **Environment Variables**: Never committed to version control

## Scalability Considerations

### Current Architecture
- **Vertical Scaling**: Vercel serverless functions auto-scale
- **Database**: Connection pooling (Prisma default: 10 connections)
- **Cache**: Distributed Redis (Upstash)
- **Queue**: RabbitMQ for async processing

### Bottlenecks & Solutions
| Bottleneck | Current Solution | Future Enhancement |
|------------|------------------|-------------------|
| Shopify API rate limits | Batch requests, pagination | Request throttling, backoff |
| Database queries | Indexes, Prisma optimization | Read replicas, sharding |
| Cache hit rate | Strategic caching | Advanced cache warming |
| Webhook processing | Async queue | Dedicated worker services |

## Error Handling Strategy

### Levels of Error Handling

1. **Client-Side**
   - Form validation
   - User-friendly error messages
   - Retry mechanisms for transient errors

2. **API Layer**
   - Try-catch blocks on all routes
   - Standardized error responses
   - HTTP status codes (4xx, 5xx)

3. **Service Layer**
   - Business logic validation
   - Transaction rollbacks on failure
   - Detailed logging

4. **Integration Layer**
   - API client retries (exponential backoff)
   - Webhook verification failures logged
   - Database constraint violations handled

### Logging
- Console logs in development
- Structured logging in production (can integrate Sentry/LogRocket)

## Monitoring & Observability

### Metrics to Track
- **Application**: Request latency, error rates, cache hit rates
- **Database**: Query performance, connection pool usage
- **Business**: Sync success rate, data freshness, user activity

### Tools (Production)
- Vercel Analytics (built-in)
- Prisma query insights
- Redis metrics (Upstash dashboard)
- RabbitMQ management console

## Deployment Architecture

### Vercel Deployment
```
Git Push → GitHub → Vercel Build
                        ↓
                  Prisma Generate
                        ↓
                   Next.js Build
                        ↓
                  Serverless Deploy
                        ↓
                   Edge Network
```

### Environment Separation
- **Development**: Local + dev database
- **Staging**: Vercel preview deployments
- **Production**: Vercel production + production DB

## Future Enhancements

### Phase 2 (Short-term)
- [ ] Webhook retry logic with exponential backoff
- [ ] Advanced analytics (cohort, RFM)
- [ ] Data export (CSV/PDF)
- [ ] Email notifications

### Phase 3 (Medium-term)
- [ ] Dedicated worker service for sync
- [ ] Advanced RBAC with custom permissions
- [ ] Multi-currency support
- [ ] API rate limiting

### Phase 4 (Long-term)
- [ ] Machine learning for predictions
- [ ] Real-time dashboard with WebSockets
- [ ] GraphQL API
- [ ] Mobile app

## Technologies Chosen - Rationale

| Technology | Reason |
|------------|--------|
| **Next.js 14** | Full-stack framework, API routes, SSR, great DX |
| **TypeScript** | Type safety, better tooling, fewer runtime errors |
| **Prisma** | Type-safe ORM, migrations, excellent PostgreSQL support |
| **PostgreSQL** | ACID compliance, complex queries, proven at scale |
| **Redis** | Fast caching, low latency, simple API |
| **RabbitMQ** | Reliable message queue, proven for async jobs |
| **NextAuth** | Easy auth setup, multiple providers, session management |
| **Tailwind CSS** | Rapid UI development, consistent design |
| **Vercel** | Zero-config deployment, edge network, serverless |

---

This architecture is designed to be:
- **Scalable**: Handles growing data and user base
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple layers of security
- **Observable**: Easy to monitor and debug
- **Extensible**: Easy to add new features
