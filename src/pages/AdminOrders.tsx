import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import type { Order, OrderStatus } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AdminOrders() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setSelectedStatus] = useState<string>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/all-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        navigate('/');
        return;
      }
      fetchOrders();
    }
  }, [user, isAdmin, authLoading, navigate, fetchOrders]);

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
      } else {
        const err = await res.text();
        alert(`Error: ${err}`);
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

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return '#00ff66';
      case 'cancelled': return '#ff4b2b';
      case 'shipped': return '#3399ff';
      case 'out for delivery': return '#ffcc00';
      case 'packed': return '#9966ff';
      default: return 'var(--accent-blue)';
    }
  };

  if (authLoading || loading) return <div className="page"><Skeleton height="400px" /></div>;

  return (
    <div className="admin-orders-page page-transition" style={{ paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-text">Order Management</h1>
        <button onClick={() => navigate('/admin')} className="glass" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Back to Dashboard</button>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input 
            type="text" 
            placeholder="Search by Order ID, Address, or UID..." 
            className="glass" 
            style={{ width: '100%', padding: '0.8rem', color: 'white' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="glass" 
          style={{ padding: '0.8rem', color: 'white', background: 'var(--bg-black)' }}
          value={statusFilter}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredOrders.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>No orders found matching criteria.</div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.orderId} className="glass" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent-blue)' }}>#{order.orderId.toUpperCase()}</span>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.25rem' }}>User: {order.uid}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={order.status} 
                    onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                    disabled={actionLoading === order.orderId}
                    className="glass"
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.8rem', 
                      background: getStatusColor(order.status),
                      color: (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'out for delivery') ? 'black' : 'white',
                      fontWeight: 'bold',
                      borderRadius: '20px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Items ({order.items.length})</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem' }}>{item.name} x {item.quantity} (${item.price})</div>
                  ))}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Delivery Address</h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{order.address}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Details</h4>
                  <p style={{ fontSize: '0.85rem' }}>Total: <strong>${order.total.toFixed(2)}</strong></p>
                  <p style={{ fontSize: '0.85rem' }}>Payment: {order.paymentMethod}</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Date: {order.createdAt ? new Date(order.createdAt._seconds * 1000).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
