import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import Skeleton from '../../components/Skeleton';
import type { Product } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, Filter, ExternalLink } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ProductManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/get-products?limit=100`);
      if (res.ok) {
        const { products } = await res.json();
        setProducts(products);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchProducts();
    }
  }, [fetchProducts, authLoading]);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/delete-product/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Product deleted successfully');
      } else {
        const errorText = await res.text();
        toast.error(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Audio', 'Accessories', 'Wearables', 'Transport'];

  return (
    <AdminLayout>
      <div className="page-transition">
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Inventory</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Manage and track your digital assets
            </p>
          </div>
          <button 
            className="neon-button" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
            onClick={() => navigate('/admin/products/add')}
          >
            <Plus size={20} /> Add New Product
          </button>
        </div>

        {/* Stats Summary - Mini Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Products', value: products.length, icon: Package, color: 'var(--accent-blue)' },
            { label: 'Low Stock Items', value: products.filter(p => (p.stock || 0) < 5).length, icon: Filter, color: '#ffcc00' },
            { label: 'Out of Stock', value: products.filter(p => (p.stock || 0) === 0).length, icon: Trash2, color: '#ff4b2b' }
          ].map((stat, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: `${stat.color}15`, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={24} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search Bar */}
        <div className="glass" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="glass" 
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  background: selectedCategory === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (selectedCategory === cat ? 'var(--accent-blue)' : 'var(--glass-border)')
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          {loading ? (
            <div style={{ padding: '2rem' }}><Skeleton height="400px" /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Product Details</th>
                    <th style={{ padding: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Pricing</th>
                    <th style={{ padding: '1.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Stock Status</th>
                    <th style={{ padding: '1.25rem', textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s ease' }}>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                            <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>{p.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>ID: {p.id.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <span style={{ 
                          padding: '0.4rem 0.8rem', 
                          borderRadius: '8px', 
                          background: 'rgba(255,255,255,0.05)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          border: '1px solid var(--glass-border)'
                        }}>{p.category}</span>
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-blue)' }}>₹{p.price.toFixed(2)}</p>
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ 
                              width: '10px', 
                              height: '10px', 
                              borderRadius: '50%', 
                              background: (p.stock || 0) > 10 ? '#00ff66' : (p.stock || 0) > 0 ? '#ffcc00' : '#ff4b2b',
                              boxShadow: `0 0 10px ${(p.stock || 0) > 10 ? '#00ff6644' : (p.stock || 0) > 0 ? '#ffcc0044' : '#ff4b2b44'}`
                            }}></div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.stock || 0} units</span>
                          </div>
                          {/* Progress Bar for Stock */}
                          <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min((p.stock || 0) * 2, 100)}%`, 
                              height: '100%', 
                              background: (p.stock || 0) > 10 ? '#00ff66' : (p.stock || 0) > 0 ? '#ffcc00' : '#ff4b2b'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => window.open(`/product/${p.id}`, '_blank')}
                            title="View on Store"
                            style={{ 
                              padding: '0.6rem', 
                              borderRadius: '10px', 
                              background: 'rgba(255,255,255,0.03)', 
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                            title="Edit Product"
                            style={{ 
                              padding: '0.6rem', 
                              borderRadius: '10px', 
                              background: 'rgba(0, 210, 255, 0.1)', 
                              color: 'var(--accent-blue)',
                              border: '1px solid rgba(0, 210, 255, 0.2)'
                            }}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Product"
                            style={{ 
                              padding: '0.6rem', 
                              borderRadius: '10px', 
                              background: 'rgba(255, 75, 43, 0.1)', 
                              color: '#ff4b2b',
                              border: '1px solid rgba(255, 75, 43, 0.2)'
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.02)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    <Package size={40} style={{ opacity: 0.2 }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No products found</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Try adjusting your search or filters to find what you're looking for.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="glass" 
                    style={{ marginTop: '1.5rem', padding: '0.7rem 1.5rem' }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </AdminLayout>
  );
}
