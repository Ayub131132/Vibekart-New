import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import { useData } from '../hooks/useData';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Product } from '../types';
import { Star, MessageSquare, Trash2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Fetch product and reviews
  const { data: product, loading, refresh: refreshProduct } = useData<Product>(`product_${id}`, `/get-product/${id}`);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/products/${id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleDeleteReview = async () => {
    if (!user || !window.confirm('Delete your review?')) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/products/${id}/reviews`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Review removed');
        fetchReviews();
        refreshProduct();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading && !product) {
    return (
      <div className="page page-transition" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <Skeleton height="400px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Skeleton height="40px" width="60%" />
            <Skeleton height="20px" width="40%" />
            <Skeleton height="100px" width="100%" />
            <Skeleton height="50px" width="30%" />
            <Skeleton height="60px" width="150px" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="page" style={{ padding: '4rem', textAlign: 'center' }}><h1>Product not found</h1></div>;
  }

  return (
    <div className="page page-transition" style={{ padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        <div className="glass" style={{ padding: '1rem', position: 'relative', minHeight: '300px' }}>
          {!imageLoaded && <Skeleton height="400px" style={{ borderRadius: 'var(--border-radius-md)' }} />}
          <img 
            src={product.image.includes('unsplash.com') ? `${product.image}&w=800&q=80&auto=format` : product.image} 
            alt={product.name} 
            onLoad={() => setImageLoaded(true)}
            style={{ 
              width: '100%', 
              borderRadius: 'var(--border-radius-md)', 
              display: imageLoaded ? 'block' : 'none' 
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              {product.category}
            </span>
            <h1 className="neon-text" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{product.name}</h1>
          </div>
          
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{product.description}</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹{product.price}</div>
            <div style={{ 
              fontSize: '0.9rem', 
              padding: '0.4rem 1rem', 
              borderRadius: '20px', 
              background: product.stock > 0 ? 'rgba(0, 255, 102, 0.1)' : 'rgba(255, 75, 43, 0.1)',
              color: product.stock > 0 ? '#00ff66' : '#ff4b2b',
              border: `1px solid ${product.stock > 0 ? '#00ff66' : '#ff4b2b'}`
            }}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
            </div>
          </div>
          
          <button 
            className="neon-button" 
            style={{ 
              width: 'fit-content', 
              padding: '1rem 3rem',
              opacity: product.stock > 0 ? 1 : 0.5,
              cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
            }}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>

          {/* New: Summary Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
             <div style={{ display: 'flex', color: '#ffcc00' }}>
               {[...Array(5)].map((_, i) => (
                 <Star 
                   key={i} 
                   size={18} 
                   fill={i < Math.floor(product.rating || 0) ? '#ffcc00' : 'none'} 
                   style={{ opacity: i < Math.floor(product.rating || 0) ? 1 : 0.3 }}
                 />
               ))}
             </div>
             <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{product.rating || '0.0'}</span>
             <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>({product.reviewsCount || 0} customer vibes)</span>
          </div>
        </div>
      </div>

      {/* --- REVIEWS SECTION --- */}
      <div style={{ marginTop: '5rem', maxWidth: '1000px' }}>
        <h2 className="neon-text" style={{ fontSize: '1.8rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageSquare size={28} /> Customer Vibes
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
          
          {/* 1. Review List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {reviewsLoading ? (
              <Skeleton height="150px" />
            ) : reviews.length === 0 ? (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                No vibes shared yet for this product.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="glass" style={{ padding: '1.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={rev.userImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.userId}`} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-dark-gray)' }} 
                      />
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{rev.userName}</p>
                        <p style={{ fontSize: '0.7rem', opacity: 0.4 }}>{new Date(rev.createdAt?._seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', color: '#ffcc00' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < rev.rating ? '#ffcc00' : 'none'} style={{ opacity: i < rev.rating ? 1 : 0.2 }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>{rev.comment}</p>
                  
                  {user?.uid === rev.userId && (
                    <button 
                      onClick={handleDeleteReview}
                      style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: '#ff4b2b', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Delete your review"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
