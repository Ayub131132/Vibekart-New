import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import Skeleton from '../../components/Skeleton';
import { Ticket, Plus, Trash2, Tag, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expiryDate: string;
}

export default function CouponManagement() {
  const { user, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchCoupons = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchCoupons();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount || !expiryDate) {
      toast.error('Please fill all fields');
      return;
    }

    setActionLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/add-coupon`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, discount, type, expiryDate }),
      });

      if (res.ok) {
        toast.success('Coupon added successfully');
        setCode('');
        setDiscount('');
        setExpiryDate('');
        setShowForm(false);
        fetchCoupons();
      } else {
        toast.error('Failed to add coupon');
      }
    } catch (err) {
      toast.error('Error adding coupon');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (couponCode: string) => {
    if (!window.confirm(`Delete coupon ${couponCode}?`)) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/admin/delete-coupon/${couponCode}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.code !== couponCode));
        toast.success('Coupon deleted');
      }
    } catch (err) {
      toast.error('Error deleting coupon');
    }
  };

  return (
    <AdminLayout>
      <div className="page-transition">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Coupons</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage promotional discount codes</p>
          </div>
          <button 
            className="neon-button" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close Form' : <><Plus size={18} /> Add Coupon</>}
          </button>
        </div>

        {showForm && (
          <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Create New Coupon</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Coupon Code</label>
                <input type="text" placeholder="e.g. VIBE20" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Discount Value</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" placeholder="0" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }} value={discount} onChange={e => setDiscount(e.target.value)} />
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                    {type === 'percentage' ? <Percent size={16} /> : <Tag size={16} />}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Type</label>
                <select className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'var(--bg-black)' }} value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Expiry Date</label>
                <input type="date" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="glass" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="neon-button" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} height="150px" />)
          ) : (
            coupons.map(coupon => (
              <div key={coupon.code} className="glass" style={{ padding: '1.5rem', border: '1px solid var(--accent-blue)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '60px', height: '60px', background: 'var(--accent-blue)', opacity: 0.1, borderRadius: '50%' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--accent-blue)' }}>
                      <Ticket size={20} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px' }}>{coupon.code}</h3>
                  </div>
                  <button onClick={() => handleDelete(coupon.code)} style={{ color: '#ff4b2b', opacity: 0.7 }}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {coupon.type === 'percentage' ? `${coupon.discount}%` : `$${coupon.discount}`}
                      <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>OFF</span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 'bold' }}>Active</div>
                </div>
              </div>
            ))
          )}
          {!loading && coupons.length === 0 && (
            <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
              No active coupons found.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
