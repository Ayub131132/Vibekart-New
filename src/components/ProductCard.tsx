import { memo, useState, useCallback } from 'react';
import type { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Skeleton from './Skeleton';

interface ProductCardProps {
  product: Product;
}

const ProductCard = memo(({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Optimized image URL
  // Only append Unsplash params if it is an Unsplash URL
  const optimizedImageUrl = product.image.includes('unsplash.com') 
    ? `${product.image}&w=400&q=75&auto=format` 
    : product.image;

  const handleCardClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product);
    }
  }, [addToCart, product]);

  // Performance: Prefetch route data on hover
  const handleHover = useCallback(() => {
    // In a real app, you would fetch(api/product/id) and cache it here
  }, []);

  return (
    <div 
      className="glass page-transition" 
      onClick={handleCardClick}
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
        cursor: 'pointer',
        position: 'relative',
        minHeight: '360px',
        contain: 'content'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        handleHover();
      }}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        aspectRatio: '1/1', 
        overflow: 'hidden',
        borderRadius: 'var(--border-radius-sm)',
        background: 'var(--bg-dark-gray)'
      }}>
        {!imageLoaded && <Skeleton height="100%" />}
        <img 
          src={optimizedImageUrl} 
          alt={product.name} 
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease-in-out',
            opacity: imageLoaded ? 1 : 0,
            display: 'block'
          }}
        />
        {product.stock <= 0 && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff4b2b',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            backdropFilter: 'blur(2px)'
          }}>
            Sold Out
          </div>
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', lineHeight: '1.2' }}>{product.name}</h3>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.85rem', 
          height: '2.6rem', 
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {product.description}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span className="neon-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          ${product.price}
        </span>
        <button 
          onClick={handleAddToCart} 
          className="neon-button" 
          disabled={product.stock <= 0}
          style={{ 
            padding: '0.4rem 0.8rem', 
            fontSize: '0.9rem', 
            zIndex: 2,
            opacity: product.stock > 0 ? 1 : 0.5,
            cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
