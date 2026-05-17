import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import type { Order, OrderStatus } from '../types';
import toast from 'react-hot-toast';
import { Package, Truck, CheckCircle, XCircle, Star, ArrowLeft } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function OrderDetails() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/get-order/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        toast.error('Order not found');
        navigate('/orders');
      }
    } catch (err) {
      console.error('Fetch order error:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchOrder();
    }
  }, [user, authLoading, navigate, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!order || !window.confirm('Are you sure you want to cancel this order?')) return;
    
    setActionLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/update-order-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: order.orderId, status: 'cancelled' }),
      });

      if (res.ok) {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
        toast.success('Order cancelled successfully');
      } else {
        const errorMsg = await res.text();
        toast.error(`Failed to cancel: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDeliveryDate = (createdAt: any) => {
    if (!createdAt) return '7 Days from now';
    const date = new Date(createdAt._seconds * 1000);
    date.setDate(date.getDate() + 5); 
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusSteps = (currentStatus: OrderStatus) => {
    const steps: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'out for delivery', 'delivered'];
    if (currentStatus === 'cancelled') return [];
    
    const currentIndex = steps.indexOf(currentStatus);
    return steps.map((step, index) => ({
      label: step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={20} color="#00ff66" />;
      case 'cancelled': return <XCircle size={20} color="#ff4b2b" />;
      case 'shipped': return <Truck size={20} color="#3399ff" />;
      default: return <Package size={20} color="var(--accent-blue)" />;
    }
  };

  const handleSubmitReview = () => {
    toast.success('Thank you for your review!');
    setShowReviewModal(null);
    setRating(5);
    setComment('');
  };

  if (authLoading || loading) {
    return (
      <div className="page" style={{ padding: '1rem' }}>
        <Skeleton height="300px" style={{ borderRadius: 'var(--border-radius-md)' }} />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="order-details-page page-transition" style={{ paddingBottom: '5rem' }}>
      <button 
        onClick={() => navigate('/orders')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.6 }}
      >
        <ArrowLeft size={18} /> Back to Orders
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Details</h1>
          <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Order ID: <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>#{order.orderId.toUpperCase()}</span></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          {getStatusIcon(order.status)}
          <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{order.status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }} className="order-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tracking */}
          {order.status !== 'cancelled' && (
            <div className="glass" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '2rem' }}>Order Progress</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '15px', 
                  left: '30px', 
                  right: '30px', 
                  height: '2px', 
                  background: 'rgba(255,255,255,0.1)',
                  zIndex: 0
                }}></div>
                {getStatusSteps(order.status).map((step, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    zIndex: 1,
                    flex: 1
                  }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: step.completed ? 'var(--accent-blue)' : 'var(--bg-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: step.active ? '2px solid white' : '2px solid rgba(255,255,255,0.1)',
                      boxShadow: step.active ? '0 0 15px var(--accent-blue)' : 'none'
                    }}>
                      {step.completed && <CheckCircle size={16} color="black" />}
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      textAlign: 'center', 
                      opacity: step.completed ? 1 : 0.4,
                      textTransform: 'capitalize',
                      fontWeight: step.active ? 'bold' : 'normal',
                      maxWidth: '70px'
                    }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Items in Order</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img src={item.image} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Quantity: {item.quantity}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                    {order.status === 'delivered' && (
                      <button 
                        onClick={() => setShowReviewModal(item.name)}
                        style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', marginTop: '0.25rem' }}
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ opacity: 0.6 }}>Subtotal</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ opacity: 0.6 }}>Shipping</span>
                <span style={{ color: '#00ff66' }}>FREE</span>
              </div>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                <span>Total</span>
                <span className="neon-text">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Payment Method</p>
              <p style={{ fontSize: '0.9rem' }}>{order.paymentMethod === 'FREE_COUPON' ? 'Free (100% Coupon)' : order.paymentMethod}</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '1rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Payment Status</p>
              <p style={{ fontSize: '0.9rem', color: order.paymentStatus === 'paid' ? '#00ff66' : 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'capitalize' }}>{order.paymentStatus || 'Pending'}</p>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Shipping Information</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Delivery Address</p>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{order.address}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                {order.status === 'delivered' ? 'Delivery Date' : 'Estimated Delivery'}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 'bold', color: order.status === 'delivered' ? '#00ff66' : 'var(--accent-blue)' }}>
                {order.status === 'delivered' ? 'Delivered' : calculateDeliveryDate(order.createdAt)}
              </p>
            </div>
          </div>

          {(order.status === 'confirmed' || order.status === 'packed') && (
            <button 
              className="glass" 
              style={{ width: '100%', padding: '1rem', color: '#ff4b2b', border: '1px solid rgba(255, 75, 43, 0.2)' }}
              onClick={handleCancelOrder}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 2000, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Review {showReviewModal}</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={32} 
                  fill={star <= rating ? 'var(--accent-blue)' : 'none'} 
                  color={star <= rating ? 'var(--accent-blue)' : 'white'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>

            <textarea 
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="glass"
              style={{ width: '100%', minHeight: '120px', padding: '1rem', marginBottom: '1.5rem', color: 'white' }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="glass" 
                style={{ flex: 1, padding: '0.8rem' }}
                onClick={() => setShowReviewModal(null)}
              >
                Cancel
              </button>
              <button 
                className="neon-button" 
                style={{ flex: 2, padding: '0.8rem' }}
                onClick={handleSubmitReview}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .order-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
