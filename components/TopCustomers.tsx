'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
}

interface TopCustomersProps {
  customers: TopCustomer[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers by Spend</h3>
      <div className="space-y-4">
        {customers.map((customer, index) => (
          <div key={customer.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
              <p className="text-sm text-gray-500">{formatNumber(customer.ordersCount)} orders</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center text-gray-500 py-8">No customer data available yet</p>
        )}
      </div>
    </div>
  );
}
