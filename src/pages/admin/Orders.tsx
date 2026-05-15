import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import Skeleton from '../../components/Skeleton';
import type { Order, OrderStatus } from '../../types';
import { Search, Filter, Eye, MoreVertical, Package, Truck, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function OrderManagement() {
  const { user, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setSelectedStatus] = useState<string>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/all-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== 'All') {
      result = result.filter(o => o.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.orderId.toLowerCase().includes(q) || 
        o.address.toLowerCase().includes(q) ||
        o.uid.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, statusFilter, orders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/update-order-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus as OrderStatus } : o));
        toast.success(`Order #${orderId.slice(-6).toUpperCase()} updated to ${newStatus}`);
      } else {
        const err = await res.text();
        toast.error(`Error: ${err}`);
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const statuses: OrderStatus[] = [
    'confirmed',
    'packed',
    'shipped',
    'out for delivery',
    'delivered',
    'cancelled'
  ];

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return { color: '#00ff66', icon: CheckCircle };
      case 'cancelled': return { color: '#ff4b2b', icon: XCircle };
      case 'shipped': return { color: '#3399ff', icon: Truck };
      case 'packed': return { color: '#9966ff', icon: Package };
      default: return { color: 'var(--accent-blue)', icon: Package };
    }
  };

  return (
    <AdminLayout>
      <div className="page-transition">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Orders</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Review and manage customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by Order ID, Address, or User ID..." 
              className="glass" 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'transparent' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="glass" 
            style={{ padding: '0.75rem 1rem', color: 'white', background: 'var(--bg-black)', minWidth: '150px' }}
            value={statusFilter}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button className="glass" style={{ padding: '0.75rem' }}>
            <Filter size={18} />
          </button>
        </div>

        {/* Orders Table */}
        <div className="glass" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem' }}><Skeleton height="400px" /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1.25rem' }}>Order ID</th>
                  <th style={{ padding: '1.25rem' }}>Customer</th>
                  <th style={{ padding: '1.25rem' }}>Total</th>
                  <th style={{ padding: '1.25rem' }}>Status</th>
                  <th style={{ padding: '1.25rem' }}>Date</th>
                  <th style={{ padding: '1.25rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const config = getStatusConfig(order.status);
                  return (
                    <tr key={order.orderId} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>#{order.orderId.slice(-8).toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.85rem' }}>{order.uid.slice(0, 10)}...</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.address}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 'bold' }}>${order.total.toFixed(2)}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select 
                            value={order.status} 
                            onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                            disabled={actionLoading === order.orderId}
                            className="glass"
                            style={{ 
                              padding: '0.3rem 0.6rem', 
                              fontSize: '0.75rem', 
                              background: config.color,
                              color: (order.status === 'delivered' || order.status === 'out for delivery' || order.status === 'cancelled') ? 'black' : 'white',
                              fontWeight: 'bold',
                              borderRadius: '20px',
                              textTransform: 'capitalize',
                              border: 'none'
                            }}
                          >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', opacity: 0.7 }}>
                        {order.createdAt ? new Date(order.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button style={{ color: 'var(--text-secondary)' }}><Eye size={18} /></button>
                          <button style={{ color: 'var(--text-secondary)' }}><MoreVertical size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <ShoppingBag size={48} opacity={0.2} />
                        <p>No orders found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
