import { cn, formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'currency' | 'default';
  currency?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  format = 'default',
  currency = 'USD',
  icon,
}: MetricCardProps) {
  const formattedValue =
    format === 'currency'
      ? formatCurrency(Number(value), currency)
      : format === 'number'
      ? formatNumber(Number(value))
      : value;

  const changeColor =
    change && change > 0
      ? 'text-green-600'
      : change && change < 0
      ? 'text-red-600'
      : 'text-gray-500';

  const ChangeIcon =
    change && change > 0
      ? ArrowUp
      : change && change < 0
      ? ArrowDown
      : Minus;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formattedValue}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <ChangeIcon className={cn('h-4 w-4', changeColor)} />
              <span className={cn('text-sm font-medium', changeColor)}>
                {formatPercentage(change)}
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
