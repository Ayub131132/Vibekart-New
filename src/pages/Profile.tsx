import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import type { Order } from '../types';
import Skeleton from '../components/Skeleton';
import { uploadImage } from '../lib/upload';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Profile() {
  const { user, dbUser, isAdmin, loading, logout, updateProfile, requestEmailChange, verifyEmailChange } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request');
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    photoURL: ''
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecentOrders = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/get-orders/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentOrders(data.slice(0, 3)); // Only show last 3
      }
    } catch (err) {
      console.error('Fetch recent orders error:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (dbUser) {
      setFormData({
        displayName: dbUser.displayName || '',
        username: dbUser.username || '',
        bio: dbUser.bio || '',
        photoURL: dbUser.photoURL || ''
      });
      setImagePreview(dbUser.photoURL || '');
      fetchRecentOrders();
    }
  }, [dbUser, fetchRecentOrders]);

  if (loading) return (
    <div className="page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass skeleton" style={{ height: '400px', width: '100%' }} />
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (!dbUser) return <div className="page">Loading profile data...</div>;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#00ff66';
      case 'cancelled': return '#ff4b2b';
      case 'shipped': return '#3399ff';
      case 'out for delivery': return '#ffcc00';
      case 'packed': return '#9966ff';
      default: return 'var(--accent-blue)';
    }
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await requestEmailChange(newEmail);
      setEmailStep('verify');
      toast.success('OTP sent to new email address');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request email change');
    } finally {
      setUpdating(false);
    }
  };

  const handleEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await verifyEmailChange(emailOtp);
      setIsUpdatingEmail(false);
      setEmailStep('request');
      setNewEmail('');
      setEmailOtp('');
      toast.success('Email updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify email change');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      let finalPhotoURL = formData.photoURL;

      if (selectedFile && user) {
        finalPhotoURL = await uploadImage(selectedFile);
      }

      await updateProfile({ ...formData, photoURL: finalPhotoURL });
      setIsEditing(false);
      setSelectedFile(null);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="page page-transition" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-text">Your Profile</h1>
        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>ID: {dbUser.numericUid}</span>
      </div>
      
      <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
        {!isEditing ? (
          <>
            <div style={{ position: 'relative' }}>
              <img 
                src={dbUser.photoURL} 
                alt={dbUser.displayName} 
                style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px solid var(--accent-blue)', boxShadow: '0 0 20px var(--accent-blue)', objectFit: 'cover' }}
              />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{dbUser.displayName}</h2>
              <p style={{ color: 'var(--accent-blue)', fontWeight: 'bold', marginBottom: '1rem' }}>@{dbUser.username}</p>
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{dbUser.bio}"</p>
            </div>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Orders</h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{dbUser.totalOrders}</p>
              </div>
              <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase' }}>Type</h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>VIBE MEMBER</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button onClick={() => setIsEditing(true)} className="neon-button" style={{ flex: 1 }}>
                  Edit Profile
                </button>
                <button onClick={logout} className="glass" style={{ flex: 1, color: '#ff4b2b', fontWeight: 'bold' }}>
                  Logout
                </button>
              </div>

              {!isUpdatingEmail ? (
                <button 
                  onClick={() => setIsUpdatingEmail(true)} 
                  className="glass" 
                  style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', opacity: 0.8 }}
                >
                  Change Account Email
                </button>
              ) : (
                <div className="glass neon-border" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>Update Email</h3>
                  {emailStep === 'request' ? (
                    <form onSubmit={handleEmailChangeRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Enter your new email address. We'll send an OTP to verify it.</p>
                      <input 
                        type="email" 
                        placeholder="New Email Address" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="glass"
                        style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="neon-button" style={{ flex: 1, padding: '0.6rem' }} disabled={updating}>
                          Send OTP
                        </button>
                        <button type="button" onClick={() => setIsUpdatingEmail(false)} className="glass" style={{ flex: 1, padding: '0.6rem' }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Enter the OTP sent to <strong>{newEmail}</strong></p>
                      <input 
                        type="text" 
                        placeholder="6-digit OTP" 
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="glass"
                        style={{ width: '100%', padding: '0.8rem', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
                        required
                        maxLength={6}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="neon-button" style={{ flex: 1, padding: '0.6rem' }} disabled={updating}>
                          Verify & Update
                        </button>
                        <button type="button" onClick={() => setEmailStep('request')} className="glass" style={{ flex: 1, padding: '0.6rem' }}>
                          Back
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              
              {isAdmin && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <Link to="/admin" className="glass neon-border" style={{ 
                    flex: 1,
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    background: 'rgba(0, 210, 255, 0.1)',
                    color: 'var(--accent-blue)',
                  }}>
                    🛠️ Admin Panel
                  </Link>
                  <Link to="/admin/orders" className="glass neon-border" style={{ 
                    flex: 1,
                    padding: '1rem', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    background: 'rgba(0, 210, 255, 0.1)',
                    color: 'var(--accent-blue)',
                  }}>
                    📦 All Orders
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* ... form content ... */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <img 
                src={imagePreview || 'https://via.placeholder.com/150'} 
                alt="Preview" 
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-blue)' }}
              />
              <button 
                type="button" 
                className="glass" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Full Name</label>
              <input 
                type="text" 
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="glass"
                style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Username</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="glass"
                style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Bio</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="glass"
                style={{ width: '100%', padding: '0.8rem', color: 'white', minHeight: '100px', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="neon-button" style={{ flex: 1 }} disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="glass" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recently Ordered Section */}
      <div className="recent-orders-section glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Recently Ordered</h2>
          <Link to="/orders" style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>View All</Link>
        </div>

        {ordersLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem 0' }}>No recent orders.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentOrders.map(order => (
              <Link key={order.orderId} to="/orders" className="glass" style={{ 
                padding: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                textDecoration: 'none',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', position: 'relative' }}>
                  {order.items.slice(0, 1).map((item, idx) => (
                    <img 
                      key={idx} 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} 
                    />
                  ))}
                  {order.items.length > 1 && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-5px', 
                      right: '-5px', 
                      background: 'var(--accent-blue)', 
                      color: 'black', 
                      fontSize: '0.6rem', 
                      padding: '2px 5px', 
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      +{order.items.length - 1}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>#{order.orderId.slice(-8).toUpperCase()}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>${order.total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {order.createdAt ? new Date(order.createdAt._seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.1rem 0.5rem', 
                      borderRadius: '10px', 
                      background: getStatusColor(order.status),
                      color: 'black',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
