import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import type { Order, OrderStatus } from '../types';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/get-orders/${user?.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to fetch your orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate, fetchOrders]);

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

  if (authLoading || loading) {
    return (
      <div className="orders-page page" style={{ padding: '1rem' }}>
        <Skeleton height="40px" width="150px" style={{ marginBottom: '2rem' }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="120px" style={{ marginBottom: '1rem', borderRadius: 'var(--border-radius-md)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="orders-page page-transition" style={{ paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Your Orders</h1>

      {orders.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ opacity: 0.6 }}>No orders yet. Start shopping!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div 
              key={order.orderId} 
              className="glass" 
              style={{ 
                padding: '1.5rem', 
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => navigate(`/order/${order.orderId}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>#{order.orderId.slice(-8).toUpperCase()}</span>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  background: getStatusColor(order.status), 
                  color: (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'out for delivery') ? 'black' : 'white',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}>
                  {order.status}
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                {order.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    {item.name} x {item.quantity}
                  </div>
                ))}
                {order.items.length > 2 && <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>+ {order.items.length - 2} more items</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                  {order.createdAt ? new Date(order.createdAt._seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>${order.total.toFixed(2)}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>View Details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
