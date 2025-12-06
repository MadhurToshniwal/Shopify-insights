import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Shopify webhook verification
function verifyShopifyWebhook(body: string, hmac: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return hash === hmac;
}

// POST /api/webhooks/shopify - Handle all Shopify webhooks
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const hmac = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');

    if (!hmac || !topic || !shopDomain) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    // Find tenant by shop domain
    const tenant = await prisma.tenant.findUnique({
      where: { shopifyStoreDomain: shopDomain },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify webhook signature
    const isValid = verifyShopifyWebhook(
      body,
      hmac,
      tenant.shopifyApiSecret || process.env.SHOPIFY_API_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Store webhook event for processing
    await prisma.webhookEvent.create({
      data: {
        tenantId: tenant.id,
        topic,
        shopifyId: payload.id?.toString(),
        payload,
        processed: false,
      },
    });

    // Process webhook immediately (or queue it)
    setTimeout(() => processWebhook(tenant.id, topic, payload), 100);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Process webhook based on topic
async function processWebhook(tenantId: string, topic: string, payload: any) {
  try {
    switch (topic) {
      case 'customers/create':
      case 'customers/update':
        await processCustomerWebhook(tenantId, payload);
        break;
      
      case 'orders/create':
      case 'orders/updated':
        await processOrderWebhook(tenantId, payload);
        break;
      
      case 'products/create':
      case 'products/update':
        await processProductWebhook(tenantId, payload);
        break;
      
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }
  } catch (error) {
    console.error(`Error processing webhook ${topic}:`, error);
  }
}

async function processCustomerWebhook(tenantId: string, customer: any) {
  await prisma.customer.upsert({
    where: {
      tenantId_shopifyCustomerId: {
        tenantId,
        shopifyCustomerId: customer.id.toString(),
      },
    },
    create: {
      tenantId,
      shopifyCustomerId: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      ordersCount: customer.orders_count || 0,
      totalSpent: parseFloat(customer.total_spent || '0'),
      shopifyCreatedAt: new Date(customer.created_at),
      shopifyUpdatedAt: new Date(customer.updated_at),
      tags: customer.tags?.split(',').map((t: string) => t.trim()) || [],
      marketingOptIn: customer.accepts_marketing || false,
    },
    update: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      ordersCount: customer.orders_count || 0,
      totalSpent: parseFloat(customer.total_spent || '0'),
      shopifyUpdatedAt: new Date(customer.updated_at),
      tags: customer.tags?.split(',').map((t: string) => t.trim()) || [],
      marketingOptIn: customer.accepts_marketing || false,
    },
  });
}

async function processOrderWebhook(tenantId: string, order: any) {
  // Find or create customer
  let customerId: string | undefined;
  if (order.customer) {
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_shopifyCustomerId: {
          tenantId,
          shopifyCustomerId: order.customer.id.toString(),
        },
      },
      create: {
        tenantId,
        shopifyCustomerId: order.customer.id.toString(),
        email: order.customer.email,
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        phone: order.customer.phone,
        ordersCount: order.customer.orders_count || 0,
        totalSpent: parseFloat(order.customer.total_spent || '0'),
        shopifyCreatedAt: new Date(order.customer.created_at),
        shopifyUpdatedAt: new Date(order.customer.updated_at),
      },
      update: {
        ordersCount: order.customer.orders_count || 0,
        totalSpent: parseFloat(order.customer.total_spent || '0'),
        shopifyUpdatedAt: new Date(order.customer.updated_at),
      },
    });
    customerId = customer.id;
  }

  await prisma.order.upsert({
    where: {
      tenantId_shopifyOrderId: {
        tenantId,
        shopifyOrderId: order.id.toString(),
      },
    },
    create: {
      tenantId,
      shopifyOrderId: order.id.toString(),
      orderNumber: order.order_number?.toString() || order.name,
      customerId,
      email: order.email,
      totalPrice: parseFloat(order.total_price || '0'),
      subtotalPrice: parseFloat(order.subtotal_price || '0'),
      totalTax: parseFloat(order.total_tax || '0'),
      currency: order.currency || 'USD',
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      shopifyCreatedAt: new Date(order.created_at),
      shopifyUpdatedAt: new Date(order.updated_at),
      cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : null,
      tags: order.tags?.split(',').map((t: string) => t.trim()) || [],
      lineItems: {
        create: order.line_items.map((item: any) => ({
          shopifyProductId: item.product_id?.toString(),
          title: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price || '0'),
          sku: item.sku,
          variantTitle: item.variant_title,
        })),
      },
    },
    update: {
      customerId,
      email: order.email,
      totalPrice: parseFloat(order.total_price || '0'),
      subtotalPrice: parseFloat(order.subtotal_price || '0'),
      totalTax: parseFloat(order.total_tax || '0'),
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      shopifyUpdatedAt: new Date(order.updated_at),
      cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : null,
      tags: order.tags?.split(',').map((t: string) => t.trim()) || [],
    },
  });
}

async function processProductWebhook(tenantId: string, product: any) {
  await prisma.product.upsert({
    where: {
      tenantId_shopifyProductId: {
        tenantId,
        shopifyProductId: product.id.toString(),
      },
    },
    create: {
      tenantId,
      shopifyProductId: product.id.toString(),
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      tags: product.tags?.split(',').map((t: string) => t.trim()) || [],
      shopifyCreatedAt: new Date(product.created_at),
      shopifyUpdatedAt: new Date(product.updated_at),
    },
    update: {
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      tags: product.tags?.split(',').map((t: string) => t.trim()) || [],
      shopifyUpdatedAt: new Date(product.updated_at),
    },
  });
}
