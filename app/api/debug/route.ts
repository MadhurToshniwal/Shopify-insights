import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      usersCount,
      tenantsCount,
      tenantUsersCount,
      productsCount,
      customersCount,
      ordersCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.tenantUser.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count(),
    ]);

    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    const tenants = await prisma.tenant.findMany({
      select: { 
        id: true, 
        name: true, 
        shopifyStoreDomain: true,
        isActive: true,
        lastSyncAt: true,
      },
    });

    const tenantUsers = await prisma.tenantUser.findMany({
      select: {
        tenantId: true,
        userId: true,
        role: true,
      },
    });

    return NextResponse.json({
      summary: {
        users: usersCount,
        tenants: tenantsCount,
        tenantUsers: tenantUsersCount,
        products: productsCount,
        customers: customersCount,
        orders: ordersCount,
      },
      details: {
        users,
        tenants,
        tenantUsers,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
