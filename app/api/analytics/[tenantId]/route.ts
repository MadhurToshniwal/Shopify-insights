import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { subDays } from 'date-fns';

// GET /api/analytics/[tenantId] - Get tenant analytics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    console.log('📊 Analytics API called for tenant:', tenantId);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found for user:', session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error('❌ User not found in database:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', user.id);

    // Check access
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenantId,
          userId: user.id,
        },
      },
    });

    if (!tenantUser) {
      console.error('❌ No access to tenant:', tenantId, 'for user:', user.id);
      // Check if tenant exists
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) {
        console.error('❌ Tenant does not exist:', tenantId);
      }
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('✅ Access granted, fetching analytics...');

    // Get analytics data
    const [metrics, topCustomers, revenueChart] = await Promise.all([
      AnalyticsService.getTenantMetrics(tenantId),
      AnalyticsService.getTopCustomers(tenantId),
      AnalyticsService.getRevenueChart(
        tenantId,
        subDays(new Date(), 30),
        new Date()
      ),
    ]);

    console.log('✅ Analytics fetched:', {
      customers: metrics.totalCustomers,
      orders: metrics.totalOrders,
      revenue: metrics.totalRevenue,
    });

    return NextResponse.json({
      metrics,
      topCustomers,
      revenueChart,
    });
  } catch (error: any) {
    console.error('❌ Error fetching analytics:', error.message);
    console.error(error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
