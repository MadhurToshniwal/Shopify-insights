import { prisma } from '@/lib/prisma';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { startOfDay, subDays, format } from 'date-fns';

export interface TenantMetrics {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export class AnalyticsService {
  
  // ==================== Main Metrics ====================
  
  static async getTenantMetrics(tenantId: string): Promise<TenantMetrics> {
    // Try cache first
    const cached = await redis.get(CACHE_KEYS.tenantMetrics(tenantId));
    if (cached) return cached as TenantMetrics;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // Current period (last 30 days)
    const [currentOrders, previousOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          tenantId,
          shopifyCreatedAt: { gte: thirtyDaysAgo },
        },
        select: {
          totalPrice: true,
        },
      }),
      prisma.order.findMany({
        where: {
          tenantId,
          shopifyCreatedAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
        select: {
          totalPrice: true,
        },
      }),
    ]);

    const currentRevenue = currentOrders.reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0);
    const previousRevenue = previousOrders.reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0);

    const [totalCustomers, totalOrders, currentCustomers, previousCustomers] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.customer.count({
        where: {
          tenantId,
          shopifyCreatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.customer.count({
        where: {
          tenantId,
          shopifyCreatedAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const totalRevenue = (await prisma.order.aggregate({
      where: { tenantId },
      _sum: { totalPrice: true },
    }))._sum.totalPrice || 0;

    const metrics: TenantMetrics = {
      totalCustomers,
      totalOrders,
      totalRevenue: Number(totalRevenue),
      averageOrderValue: totalOrders > 0 ? Number(totalRevenue) / totalOrders : 0,
      revenueGrowth: previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0,
      orderGrowth: previousOrders.length > 0
        ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
        : 0,
      customerGrowth: previousCustomers > 0
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
        : 0,
    };

    // Cache for 5 minutes
    await redis.set(CACHE_KEYS.tenantMetrics(tenantId), metrics, { ex: CACHE_TTL.metrics });

    return metrics;
  }

  // ==================== Top Customers ====================
  
  static async getTopCustomers(tenantId: string, limit = 5): Promise<TopCustomer[]> {
    const cached = await redis.get(CACHE_KEYS.topCustomers(tenantId));
    if (cached) return cached as TopCustomer[];

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalSpent: true,
        ordersCount: true,
      },
    });

    const topCustomers: TopCustomer[] = customers.map((c: any) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Anonymous',
      email: c.email || 'N/A',
      totalSpent: Number(c.totalSpent),
      ordersCount: c.ordersCount,
    }));

    await redis.set(CACHE_KEYS.topCustomers(tenantId), topCustomers, { ex: CACHE_TTL.metrics });

    return topCustomers;
  }

  // ==================== Revenue Chart ====================
  
  static async getRevenueChart(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueChartData[]> {
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        shopifyCreatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        shopifyCreatedAt: true,
        totalPrice: true,
      },
      orderBy: {
        shopifyCreatedAt: 'asc',
      },
    });

    // Group by date
    const dataMap = new Map<string, { revenue: number; orders: number }>();

    orders.forEach((order: any) => {
      const dateKey = format(startOfDay(order.shopifyCreatedAt), 'yyyy-MM-dd');
      const existing = dataMap.get(dateKey) || { revenue: 0, orders: 0 };
      dataMap.set(dateKey, {
        revenue: existing.revenue + Number(order.totalPrice),
        orders: existing.orders + 1,
      });
    });

    // Convert to array and fill missing dates
    const chartData: RevenueChartData[] = [];
    let currentDate = startOfDay(startDate);

    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const data = dataMap.get(dateKey) || { revenue: 0, orders: 0 };
      chartData.push({
        date: dateKey,
        revenue: data.revenue,
        orders: data.orders,
      });
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return chartData;
  }

  // ==================== Customer Lifetime Value ====================
  
  static async getCustomerLTV(tenantId: string): Promise<number> {
    const result = await prisma.customer.aggregate({
      where: { tenantId },
      _avg: { totalSpent: true },
    });

    return Number(result._avg.totalSpent || 0);
  }

  // ==================== Order Status Distribution ====================
  
  static async getOrderStatusDistribution(tenantId: string) {
    const orders = await prisma.order.groupBy({
      by: ['financialStatus'],
      where: { tenantId },
      _count: true,
    });

    return orders.map((o: any) => ({
      status: o.financialStatus || 'unknown',
      count: o._count,
    }));
  }
}
