'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/components/MetricCard';
import { RevenueChart } from '@/components/RevenueChart';
import { TopCustomers } from '@/components/TopCustomers';
import { TenantModal } from '@/components/TenantModal';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  LogOut,
  Store
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Tenant {
  id: string;
  name: string;
  shopifyStoreDomain: string;
  isActive: boolean;
  lastSyncAt: string | null;
  role: string;
}

interface Analytics {
  metrics: {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    ordersCount: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    metrics: {
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      orderGrowth: 0,
      customerGrowth: 0,
    },
    topCustomers: [],
    revenueChart: [],
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTenants();
    }
  }, [status]);

  useEffect(() => {
    if (selectedTenant) {
      fetchAnalytics(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      if (!res.ok) {
        if (res.status === 401) {
          // Not authenticated - redirect handled by useEffect
          return;
        }
        throw new Error(`Failed to fetch tenants: ${res.status}`);
      }
      const data = await res.json();
      setTenants(data.tenants || []);
      if (data.tenants?.length > 0 && !selectedTenant) {
        setSelectedTenant(data.tenants[0].id);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (tenantId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/${tenantId}`);
      if (!res.ok) {
        if (res.status === 401) {
          // Not authenticated - will be redirected by useEffect
          return;
        }
        console.warn(`Analytics fetch failed with status ${res.status}`);
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      // Silently set default empty analytics - this is normal before sign-in
      setAnalytics({
        metrics: {
          totalCustomers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          revenueGrowth: 0,
          orderGrowth: 0,
          customerGrowth: 0,
        },
        topCustomers: [],
        revenueChart: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedTenant) return;
    setSyncing(true);
    try {
      await fetch(`/api/tenants/${selectedTenant}/sync`, { method: 'POST' });
      // Refresh analytics after sync
      setTimeout(() => {
        fetchAnalytics(selectedTenant);
        fetchTenants();
      }, 2000);
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Xeno Insights</h1>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </nav>
        <div className="max-w-md mx-auto mt-20 text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Stores Connected</h2>
          <p className="text-gray-600 mb-6">
            Connect your Shopify store to start analyzing your data
          </p>
          <button
            onClick={() => setShowTenantModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Your First Store
          </button>
        </div>
        <TenantModal isOpen={showTenantModal} onClose={() => {
          setShowTenantModal(false);
          fetchTenants();
        }} />
      </div>
    );
  }

  const currentTenant = tenants.find(t => t.id === selectedTenant);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Xeno Insights</h1>
              </div>
              <select
                value={selectedTenant || ''}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={() => setShowTenantModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Store
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          {currentTenant?.lastSyncAt && (
            <p className="text-sm text-gray-500 mt-2">
              Last synced: {new Date(currentTenant.lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Customers"
            value={analytics.metrics.totalCustomers}
            format="number"
            change={analytics.metrics.customerGrowth}
            changeLabel="vs last 30 days"
            icon={<Users className="h-6 w-6" />}
          />
          <MetricCard
            title="Total Orders"
            value={analytics.metrics.totalOrders}
            format="number"
            change={analytics.metrics.orderGrowth}
            changeLabel="vs last 30 days"
            icon={<ShoppingCart className="h-6 w-6" />}
          />
          <MetricCard
            title="Total Revenue"
            value={analytics.metrics.totalRevenue}
            format="currency"
            change={analytics.metrics.revenueGrowth}
            changeLabel="vs last 30 days"
                icon={<DollarSign className="h-6 w-6" />}
              />
              <MetricCard
            title="Avg Order Value"
            value={analytics.metrics.averageOrderValue}
            format="currency"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={analytics.revenueChart} />
          </div>
          <div>
            <TopCustomers customers={analytics.topCustomers} />
          </div>
        </div>
      </main>

      <TenantModal isOpen={showTenantModal} onClose={() => {
        setShowTenantModal(false);
        fetchTenants();
      }} />
    </div>
  );
}
