import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Skeleton from '../components/Skeleton';
import { useData } from '../hooks/useData';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Product } from '../types';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToCart } = useCart();

  // Fetch product from DB via useData hook
  const { data: product, loading } = useData<Product>(`product_${id}`, `/get-product/${id}`);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product);
      toast.success(`${product.name} added to cart!`);
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
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${product.price}</div>
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
        </div>
      </div>
    </div>
  );
}
