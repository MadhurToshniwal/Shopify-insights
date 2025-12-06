import axios, { AxiosInstance } from 'axios';

export interface ShopifyConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion?: string;
}

export class ShopifyClient {
  private client: AxiosInstance;
  private storeDomain: string;

  constructor(config: ShopifyConfig) {
    this.storeDomain = config.storeDomain;
    const apiVersion = config.apiVersion || '2024-01';

    this.client = axios.create({
      baseURL: `https://${config.storeDomain}/admin/api/${apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== Customers ====================
  
  async getCustomers(params: { limit?: number; since_id?: string } = {}) {
    try {
      console.log(`🔄 Shopify API: Fetching customers from ${this.storeDomain} with params:`, params);
      const { data } = await this.client.get('/customers.json', { params });
      console.log(`✅ Shopify API: Retrieved ${data.customers.length} customers`);
      return data.customers;
    } catch (error: any) {
      console.error('❌ Shopify API Error (getCustomers):', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.errors || error.message,
        storeDomain: this.storeDomain,
      });
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    const { data } = await this.client.get(`/customers/${customerId}.json`);
    return data.customer;
  }

  // ==================== Orders ====================
  
  async getOrders(params: { limit?: number; since_id?: string; created_at_min?: string } = {}) {
    try {
      console.log(`🔄 Shopify API: Fetching orders from ${this.storeDomain}`);
      const { data } = await this.client.get('/orders.json', { 
        params: { status: 'any', ...params } 
      });
      console.log(`✅ Shopify API: Retrieved ${data.orders.length} orders`);
      return data.orders;
    } catch (error: any) {
      console.error('❌ Shopify API Error (getOrders):', {
        status: error.response?.status,
        message: error.response?.data?.errors || error.message,
      });
      throw error;
    }
  }

  async getOrder(orderId: string) {
    const { data } = await this.client.get(`/orders/${orderId}.json`);
    return data.order;
  }

  // ==================== Products ====================
  
  async getProducts(params: { limit?: number; since_id?: string } = {}) {
    try {
      console.log(`🔄 Shopify API: Fetching products from ${this.storeDomain}`);
      const { data } = await this.client.get('/products.json', { params });
      console.log(`✅ Shopify API: Retrieved ${data.products.length} products`);
      return data.products;
    } catch (error: any) {
      console.error('❌ Shopify API Error (getProducts):', {
        status: error.response?.status,
        message: error.response?.data?.errors || error.message,
      });
      throw error;
    }
  }

  async getProduct(productId: string) {
    const { data } = await this.client.get(`/products/${productId}.json`);
    return data.product;
  }

  // ==================== Webhooks ====================
  
  async createWebhook(topic: string, address: string) {
    const { data } = await this.client.post('/webhooks.json', {
      webhook: {
        topic,
        address,
        format: 'json',
      },
    });
    return data.webhook;
  }

  async getWebhooks() {
    const { data } = await this.client.get('/webhooks.json');
    return data.webhooks;
  }

  async deleteWebhook(webhookId: string) {
    await this.client.delete(`/webhooks/${webhookId}.json`);
  }

  // ==================== Shop Info ====================
  
  async getShopInfo() {
    const { data } = await this.client.get('/shop.json');
    return data.shop;
  }
}

export function createShopifyClient(storeDomain: string, accessToken: string): ShopifyClient {
  return new ShopifyClient({ storeDomain, accessToken });
}
