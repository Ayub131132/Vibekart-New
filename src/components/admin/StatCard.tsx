import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = memo(({ title, value, icon: Icon, color, trend }: StatCardProps) => {
  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{value}</h3>
        </div>
        <div style={{ 
          padding: '0.75rem', 
          borderRadius: '12px', 
          background: `${color}20`, 
          color: color 
        }}>
          <Icon size={24} />
        </div>
      </div>
      
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ 
            color: trend.isPositive ? '#00ff66' : '#ff4b2b',
            fontWeight: 'bold'
          }}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>from last month</span>
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';
export default StatCard;
