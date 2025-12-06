import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Redis configuration missing');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache utilities
export const CACHE_KEYS = {
  tenantMetrics: (tenantId: string) => `metrics:${tenantId}`,
  topCustomers: (tenantId: string) => `top-customers:${tenantId}`,
  revenueChart: (tenantId: string) => `revenue-chart:${tenantId}`,
} as const;

export const CACHE_TTL = {
  metrics: 300, // 5 minutes
  charts: 600, // 10 minutes
} as const;
