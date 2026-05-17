import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import SimpleChart from '../../components/admin/SimpleChart';
import { useAuth } from '../../context/AuthContext';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  Package, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  salesOverTime: { date: string, sales: number, orders: number }[];
  recentActivity: { id: string, type: string, title: string, subtitle: string, timestamp: number }[];
  trends: {
    revenue: number | null;
    orders: number | null;
    users: number | null;
  };
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${BACKEND_URL}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        } else {
          const errText = await res.text();
          setError(errText || 'Failed to fetch analytics');
          toast.error('Failed to fetch analytics');
        }
      } catch (err) {
        console.error('Analytics error:', err);
        setError('Error connecting to server');
        toast.error('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchAnalytics();
      } else {
        setLoading(false);
        setError('Please log in as an administrator.');
      }
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height="120px" />)}
        </div>
        <Skeleton height="300px" />
      </AdminLayout>
    );
  }

  if (error || !analytics) {
    return (
      <AdminLayout>
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: '#ff4b2b', marginBottom: '1rem' }}>SYSTEM_ERROR_VIBE_LOST</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || 'The analytics matrix encountered a glitch.'}</p>
          <button onClick={() => window.location.reload()} className="neon-button">REBOOT SYSTEM</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-transition">
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <StatCard 
            title="Completed Revenue" 
            value={`₹${(analytics?.totalRevenue || 0).toLocaleString()}`} 
            icon={IndianRupee} 
            color="#00d2ff"
            trend={analytics?.trends?.revenue !== null && analytics?.trends?.revenue !== undefined ? { value: Math.abs(analytics.trends.revenue), isPositive: analytics.trends.revenue >= 0 } : undefined}
          />
          <StatCard 
            title="Total Orders" 
            value={analytics?.totalOrders || 0} 
            icon={ShoppingBag} 
            color="#9d50bb"
            trend={analytics?.trends?.orders !== null && analytics?.trends?.orders !== undefined ? { value: Math.abs(analytics.trends.orders), isPositive: analytics.trends.orders >= 0 } : undefined}
          />
          <StatCard 
            title="Total Users" 
            value={analytics?.totalUsers || 0} 
            icon={Users} 
            color="#00ff66"
            trend={analytics?.trends?.users !== null && analytics?.trends?.users !== undefined ? { value: Math.abs(analytics.trends.users), isPositive: analytics.trends.users >= 0 } : undefined}
          />
          <StatCard 
            title="Total Products" 
            value={analytics?.totalProducts || 0} 
            icon={Package} 
            color="#ffcc00"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Chart */}
          <SimpleChart data={analytics?.salesOverTime || []} />

          {/* Recent Activity */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {analytics?.recentActivity.map(activity => (
                <div key={activity.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    padding: '0.5rem', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--accent-blue)'
                  }}>
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{activity.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activity.subtitle} • {getRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
              {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
