import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataSyncService } from '@/lib/services/sync.service';

// POST /api/tenants/[tenantId]/sync - Trigger manual sync
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenantId,
          userId: user.id,
        },
      },
    });

    if (!tenantUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Trigger direct sync (not via RabbitMQ queue)
    console.log('Starting manual sync for tenant:', tenantId);
    
    const results = await Promise.allSettled([
      DataSyncService.syncCustomers(tenantId),
      DataSyncService.syncProducts(tenantId),
      DataSyncService.syncOrders(tenantId),
    ]);

    const customerCount = results[0].status === 'fulfilled' ? results[0].value : 0;
    const productCount = results[1].status === 'fulfilled' ? results[1].value : 0;
    const orderCount = results[2].status === 'fulfilled' ? results[2].value : 0;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { lastSyncAt: new Date() },
    });

    console.log('✅ Manual sync completed:', { customerCount, productCount, orderCount });

    return NextResponse.json({
      success: true,
      synced: {
        customers: customerCount,
        products: productCount,
        orders: orderCount,
      },
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
