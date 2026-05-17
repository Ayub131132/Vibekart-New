import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import type { Product } from '../types';
import { uploadImage } from '../lib/upload';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Audio');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/get-products`);
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
      if (!user || !isAdmin) {
        toast.error('Access Denied: Admins Only');
        navigate('/');
        return;
      }
      fetchProducts();
    }
  }, [user, isAdmin, authLoading, navigate, fetchProducts]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('Audio');
    setStock('');
    setDescription('');
    setImage(null);
    setSelectedFile(null);
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setStock(product.stock?.toString() || '0');
    setDescription(product.description);
    setImage(product.image);
    setSelectedFile(null);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category || !description || stock === '' || (!image && !editingId)) {
      toast.error('Please fill all fields');
      return;
    }

    setActionLoading(true);
    try {
      let finalImageUrl = image;

      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      const token = await user?.getIdToken();
      const url = editingId 
        ? `${BACKEND_URL}/update-product/${editingId}`
        : `${BACKEND_URL}/add-product`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, price, description, category, image: finalImageUrl, stock }),
      });

      if (res.ok) {
        toast.success(editingId ? 'Product updated successfully' : 'Product added successfully');
        clearForm();
        fetchProducts();
      } else {
        const errorText = await res.text();
        toast.error(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Error saving product. Check console.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    
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
        if (editingId === id) clearForm();
        toast.success('Product deleted');
      } else {
        const errorText = await res.text();
        toast.error(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete product');
    }
  };

  if (authLoading || loading) return <div className="page"><Skeleton height="400px" /></div>;

  return (
    <div className="admin-page page-transition" style={{ paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-text">Admin Panel</h1>
        <button onClick={() => navigate('/admin/orders')} className="neon-button" style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}>
          📦 Manage Orders
        </button>
      </div>

      <div className="cart-container">
        {/* Product Form (Add/Edit) */}
        <form className="glass" style={{ padding: '2rem', height: 'fit-content' }} onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            {editingId ? 'Edit Product' : 'Add New Item'}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder="Product Title" className="glass" style={{ padding: '0.8rem', color: 'white' }} value={name} onChange={e => setName(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="number" placeholder="Price (₹)" className="glass" style={{ flex: 1, padding: '0.8rem', color: 'white' }} value={price} onChange={e => setPrice(e.target.value)} />
              <input type="number" placeholder="Stock" className="glass" style={{ flex: 1, padding: '0.8rem', color: 'white' }} value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            
            <select className="glass" style={{ padding: '0.8rem', color: 'white', background: 'var(--bg-black)' }} value={category} onChange={e => setCategory(e.target.value)}>
              {['Audio', 'Accessories', 'Wearables', 'Transport'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <textarea placeholder="Description" className="glass" style={{ padding: '0.8rem', color: 'white', minHeight: '100px' }} value={description} onChange={e => setDescription(e.target.value)} />
            
            <div style={{ textAlign: 'center' }}>
              <label className="neon-button" style={{ display: 'inline-block', cursor: 'pointer', fontSize: '0.8rem' }}>
                {image ? 'Change Image' : 'Upload Image'}
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </label>
              {image && <img src={image} style={{ width: '100%', height: '150px', objectFit: 'cover', marginTop: '1rem', borderRadius: '8px' }} />}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="neon-button" style={{ flex: 2 }} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : (editingId ? 'Update Product' : 'Post Product')}
              </button>
              {editingId && (
                <button type="button" className="glass" style={{ flex: 1 }} onClick={clearForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Product List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Manage Products ({products.length})</h2>
          {products.map(p => (
            <div key={p.id} className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img src={p.image} style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem' }}>{p.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>₹{p.price} | Stock: {p.stock}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleEditClick(p)} 
                  style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteProduct(p.id)} 
                  style={{ color: '#ff4b2b', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
