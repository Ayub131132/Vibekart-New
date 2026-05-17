import { memo } from 'react';

interface DataPoint {
  date: string;
  sales: number;
}

interface SimpleChartProps {
  data: DataPoint[];
  color?: string;
}

const SimpleChart = memo(({ data, color = 'var(--accent-blue)' }: SimpleChartProps) => {
  if (!data || data.length === 0) return <div>No data available</div>;

  const maxSales = Math.max(...data.map(d => d.sales), 1);
  
  return (
    <div className="glass" style={{ padding: '1.5rem', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Delivered Sales (Last 7 Days)</h3>
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '0.5rem',
        paddingTop: '1rem'
      }}>
        {data.map((d, i) => (
          <div key={i} style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{ 
              width: '100%', 
              height: `${(d.sales / maxSales) * 100}%`, 
              background: `linear-gradient(to top, ${color}20, ${color})`,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.5s ease',
              minHeight: d.sales > 0 ? '4px' : '0'
            }} title={`₹${d.sales}`}></div>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', transform: 'rotate(-45deg)', marginTop: '5px' }}>
              {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

SimpleChart.displayName = 'SimpleChart';
export default SimpleChart;
