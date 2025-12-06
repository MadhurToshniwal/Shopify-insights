import { prisma } from '@/lib/prisma';
import { createShopifyClient } from '@/lib/shopify';
import { publishToQueue, QUEUES } from '@/lib/rabbitmq';

export class DataSyncService {
  
  // ==================== Full Sync ====================
  
  static async fullSync(tenantId: string): Promise<void> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');

    const syncLog = await prisma.syncLog.create({
      data: {
        tenantId,
        syncType: 'full',
        entityType: 'all',
        status: 'running',
      },
    });

    try {
      // Queue sync jobs for parallel processing
      await Promise.all([
        publishToQueue(QUEUES.CUSTOMER_SYNC, { tenantId, syncLogId: syncLog.id }),
        publishToQueue(QUEUES.PRODUCT_SYNC, { tenantId, syncLogId: syncLog.id }),
        publishToQueue(QUEUES.ORDER_SYNC, { tenantId, syncLogId: syncLog.id }),
      ]);

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { lastSyncAt: new Date() },
      });
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  // ==================== Customer Sync ====================
  
  static async syncCustomers(tenantId: string): Promise<number> {
    console.log(`\n🔄 Starting customer sync for tenant: ${tenantId}`);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error('❌ Tenant not found:', tenantId);
      throw new Error('Tenant not found');
    }

    console.log(`📝 Tenant details:`, {
      name: tenant.name,
      domain: tenant.shopifyStoreDomain,
      tokenPreview: tenant.shopifyAccessToken.substring(0, 20) + '...',
    });

    const shopify = createShopifyClient(tenant.shopifyStoreDomain, tenant.shopifyAccessToken);
    
    let processed = 0;
    let sinceId: string | undefined;
    const limit = 250; // Max allowed by Shopify

    try {
      while (true) {
        const customers = await shopify.getCustomers({ limit, since_id: sinceId });
        if (customers.length === 0) {
          console.log('ℹ️ No more customers to sync');
          break;
        }

      // Batch upsert customers
      await Promise.all(
        customers.map((customer: any) =>
          prisma.customer.upsert({
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
          })
        )
      );

        processed += customers.length;
        console.log(`✅ Processed batch: ${customers.length} customers (Total: ${processed})`);
        sinceId = customers[customers.length - 1].id.toString();

        if (customers.length < limit) break;
      }

      console.log(`✅ Customer sync completed: ${processed} customers synced\n`);
      return processed;
    } catch (error: any) {
      console.error('❌ Customer sync failed:', {
        tenantId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // ==================== Order Sync ====================
  
  static async syncOrders(tenantId: string): Promise<number> {
    console.log(`\n🔄 Starting order sync for tenant: ${tenantId}`);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error('❌ Tenant not found:', tenantId);
      throw new Error('Tenant not found');
    }

    const shopify = createShopifyClient(tenant.shopifyStoreDomain, tenant.shopifyAccessToken);
    
    let processed = 0;
    let sinceId: string | undefined;
    const limit = 250;

    try {
      while (true) {
        const orders = await shopify.getOrders({ limit, since_id: sinceId });
        if (orders.length === 0) {
          console.log('ℹ️ No more orders to sync');
          break;
        }

      for (const order of orders) {
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
              email: order.customer.email,
              firstName: order.customer.first_name,
              lastName: order.customer.last_name,
              ordersCount: order.customer.orders_count || 0,
              totalSpent: parseFloat(order.customer.total_spent || '0'),
              shopifyUpdatedAt: new Date(order.customer.updated_at),
            },
          });
          customerId = customer.id;
        }

        // Upsert order
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

        processed++;
      }

      sinceId = orders[orders.length - 1].id.toString();
      console.log(`✅ Processed batch: ${orders.length} orders (Total: ${processed})`);
      if (orders.length < limit) break;
    }

    console.log(`✅ Order sync completed: ${processed} orders synced\n`);
    return processed;
    } catch (error: any) {
      console.error('❌ Order sync failed:', {
        tenantId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // ==================== Product Sync ====================
  
  static async syncProducts(tenantId: string): Promise<number> {
    console.log(`\n🔄 Starting product sync for tenant: ${tenantId}`);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error('❌ Tenant not found:', tenantId);
      throw new Error('Tenant not found');
    }

    const shopify = createShopifyClient(tenant.shopifyStoreDomain, tenant.shopifyAccessToken);
    
    let processed = 0;
    let sinceId: string | undefined;
    const limit = 250;

    try {
      while (true) {
        const products = await shopify.getProducts({ limit, since_id: sinceId });
        if (products.length === 0) {
          console.log('ℹ️ No more products to sync');
          break;
        }

      await Promise.all(
        products.map((product: any) =>
          prisma.product.upsert({
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
              variants: {
                create: product.variants.map((variant: any) => ({
                  shopifyVariantId: variant.id.toString(),
                  title: variant.title,
                  sku: variant.sku,
                  price: parseFloat(variant.price || '0'),
                  compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                  inventoryQuantity: variant.inventory_quantity || 0,
                })),
              },
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
          })
        )
      );

      processed += products.length;
      console.log(`✅ Processed batch: ${products.length} products (Total: ${processed})`);
      sinceId = products[products.length - 1].id.toString();

      if (products.length < limit) break;
    }

    console.log(`✅ Product sync completed: ${processed} products synced\n`);
    return processed;
    } catch (error: any) {
      console.error('❌ Product sync failed:', {
        tenantId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
