import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Skeleton from '../components/Skeleton';
import type { Product } from '../types';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const PRODUCTS_PER_PAGE = 8;

export default function Home() {
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchProducts = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      // Use the latest lastId for pagination
      if (isLoadMore && lastId) {
        params.append('lastId', lastId);
      }
      
      params.append('limit', PRODUCTS_PER_PAGE.toString());
      
      const url = `${BACKEND_URL}/get-products?${params.toString()}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const { products: newProducts, lastId: newLastId, hasMore: moreAvailable } = await res.json();
        
        setDynamicProducts(prev => isLoadMore ? [...prev, ...newProducts] : newProducts);
        setLastId(newLastId);
        setHasMore(moreAvailable);
      } else {
        throw new Error('Failed to fetch from server');
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      if (!isLoadMore) {
        setError('We hit a glitch in the Matrix. Could not load products.');
      }
      toast.error('Connection to vibe-server failed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, debouncedSearch, lastId]);

  const lastProductElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchProducts(true);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchProducts]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pagination when category or search changes
  useEffect(() => {
    setDynamicProducts([]);
    setLastId(null);
    setHasMore(true);
    
    // Perform initial fetch
    const initialFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        if (debouncedSearch) params.append('search', debouncedSearch);
        params.append('limit', PRODUCTS_PER_PAGE.toString());
        
        const res = await fetch(`${BACKEND_URL}/get-products?${params.toString()}`);
        if (res.ok) {
          const { products: newProducts, lastId: newLastId, hasMore: moreAvailable } = await res.json();
          setDynamicProducts(newProducts);
          setLastId(newLastId);
          setHasMore(moreAvailable);
        } else {
          throw new Error('Server responded with an error');
        }
      } catch (err) {
        console.error('Initial fetch error:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, [selectedCategory, debouncedSearch]);

  const categories = ['All', 'Audio', 'Accessories', 'Wearables', 'Transport'];

  return (
    <div className="home-page page-transition">
      {/* 1. Hero Shell */}
      <div style={{ marginBottom: '2rem', width: '100%' }}>
        <header className="glass" style={{ 
          padding: '2.5rem 1.5rem', 
          textAlign: 'center',
          background: 'var(--accent-neon)',
          color: 'white',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: '0 10px 30px rgba(0, 210, 255, 0.2)'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Cyber Sale 2026
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: 500 }}>
            Up to 50% off on all neon gear. Limited time only.
          </p>
        </header>
      </div>

      {/* 2. Search Bar */}
      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Search products..."
          className="glass"
          style={{ 
            width: '100%', 
            padding: '1rem 1.5rem', 
            paddingLeft: '3rem',
            borderRadius: '12px',
            color: 'white',
            border: searchQuery ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
            transition: 'all 0.3s ease'
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
      </div>

      {/* 3. Category Chips */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            className="glass" 
            style={{ 
              padding: '0.5rem 1.5rem', 
              borderRadius: '20px', 
              whiteSpace: 'nowrap',
              border: selectedCategory === cat ? '1px solid var(--accent-blue)' : '1px solid transparent',
              background: selectedCategory === cat ? 'rgba(0, 210, 255, 0.1)' : 'var(--glass-bg)',
              color: selectedCategory === cat ? 'var(--accent-blue)' : 'white'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Product Grid */}
      {error && !loading && dynamicProducts.length === 0 && (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', margin: '2rem 0', border: '1px solid rgba(255, 75, 43, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <h2 style={{ color: '#ff4b2b', marginBottom: '1rem' }}>Vibe Disconnected</h2>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>{error}</p>
          <button className="neon-button" onClick={() => fetchProducts()}>RETRY CONNECTION</button>
        </div>
      )}

      <div className="product-grid">
        {dynamicProducts.map((product, index) => {
          if (dynamicProducts.length === index + 1) {
            return (
              <div ref={lastProductElementRef} key={product.id}>
                <ProductCard product={product} />
              </div>
            );
          } else {
            return <ProductCard key={product.id} product={product} />;
          }
        })}
        
        {loading && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem', height: '360px' }}>
              <Skeleton height="180px" />
              <Skeleton height="24px" width="70%" style={{ marginTop: '1rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                <Skeleton height="24px" width="40px" />
                <Skeleton height="36px" width="80px" />
              </div>
            </div>
          ))
        )}
      </div>

      {loadingMore && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="neon-text" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>LOADING MORE VIBES...</div>
        </div>
      )}

      {!loading && dynamicProducts.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
          No products found.
        </div>
      )}

      {!hasMore && dynamicProducts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3, fontSize: '0.8rem' }}>
          — YOU'VE REACHED THE END OF THE VIBE —
        </div>
      )}
    </div>
  );
}
