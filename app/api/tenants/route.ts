import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataSyncService } from '@/lib/services/sync.service';
import { z } from 'zod';

const tenantSchema = z.object({
  name: z.string().min(1),
  shopifyStoreDomain: z.string().regex(/^[a-z0-9-]+\.myshopify\.com$/),
  shopifyAccessToken: z.string().min(1),
  shopifyApiKey: z.string().optional(),
  shopifyApiSecret: z.string().optional(),
});

// GET /api/tenants - List all tenants for current user
export async function GET(req: NextRequest) {
  try {
    console.log('🏪 Fetching tenants...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found for:', session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                shopifyStoreDomain: true,
                isActive: true,
                lastSyncAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.error('❌ User not found:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenants = user.tenants.map((tu: any) => ({
      ...tu.tenant,
      role: tu.role,
    }));

    console.log('✅ Found tenants:', tenants.length);
    if (tenants.length > 0) {
      console.log('   First tenant:', tenants[0].id, '-', tenants[0].name);
    }

    return NextResponse.json({ tenants });
  } catch (error: any) {
    console.error('❌ Error fetching tenants:', error.message);
    console.error(error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenants - Create new tenant
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = tenantSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if tenant with same domain already exists
    const existing = await prisma.tenant.findUnique({
      where: { shopifyStoreDomain: validatedData.shopifyStoreDomain },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tenant with this Shopify domain already exists' },
        { status: 400 }
      );
    }

    // Create tenant and associate with user
    const tenant = await prisma.tenant.create({
      data: {
        ...validatedData,
        users: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });

    // Trigger initial sync directly (don't wait for RabbitMQ)
    setTimeout(async () => {
      try {
        console.log('Starting direct sync for tenant:', tenant.id);
        await DataSyncService.syncCustomers(tenant.id);
        await DataSyncService.syncProducts(tenant.id);
        await DataSyncService.syncOrders(tenant.id);
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { lastSyncAt: new Date() },
        });
        console.log('✅ Initial sync completed for tenant:', tenant.id);
      } catch (error) {
        console.error('❌ Initial sync failed:', error);
      }
    }, 1000);

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
