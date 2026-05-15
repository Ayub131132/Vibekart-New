import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { uploadImage } from '../../lib/upload';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, Save, X, Package } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Audio');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/get-product/${id}`);
          if (res.ok) {
            const product = await res.json();
            setName(product.name);
            setPrice(product.price.toString());
            setCategory(product.category);
            setStock(product.stock?.toString() || '0');
            setDescription(product.description);
            setImage(product.image);
          } else {
            toast.error('Product not found');
            navigate('/admin/products');
          }
        } catch (err) {
          console.error('Fetch error:', err);
          toast.error('Failed to load product');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing, navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category || !description || stock === '' || (!image && !isEditing)) {
      toast.error('Please fill all required fields');
      return;
    }

    setActionLoading(true);
    try {
      let finalImageUrl = image;

      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      const token = await user?.getIdToken();
      const url = isEditing 
        ? `${BACKEND_URL}/update-product/${id}`
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
        toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
        navigate('/admin/products');
      } else {
        const errorText = await res.text();
        toast.error(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Error saving product');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-transition">
          <Skeleton height="40px" width="200px" style={{ marginBottom: '2rem' }} />
          <div className="glass" style={{ padding: '2rem' }}>
            <Skeleton height="400px" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-transition" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/admin/products')}
            className="glass" 
            style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isEditing ? `Updating ${name}` : 'Fill in the details to create a new vibe'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} /> Basic Information
              </h3>
              
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Product Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cyberpunk Mechanical Keyboard" 
                  className="glass" 
                  style={{ width: '100%', padding: '0.8rem', color: 'white' }} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="glass" 
                    style={{ width: '100%', padding: '0.8rem', color: 'white' }} 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Inventory (Stock)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="glass" 
                    style={{ width: '100%', padding: '0.8rem', color: 'white' }} 
                    value={stock} 
                    onChange={e => setStock(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Category</label>
                <select 
                  className="glass" 
                  style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'var(--bg-black)' }} 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                >
                  {['Audio', 'Accessories', 'Wearables', 'Transport'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  placeholder="Describe the vibe..." 
                  className="glass" 
                  style={{ width: '100%', padding: '0.8rem', color: 'white', minHeight: '150px', resize: 'vertical' }} 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Sidebar Area (Media & Actions) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} /> Media
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {image ? (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                    <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                    <button 
                      type="button" 
                      onClick={() => { setImage(null); setSelectedFile(null); }} 
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        background: 'rgba(255, 75, 43, 0.9)', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label className="glass" style={{ 
                    width: '100%', 
                    aspectRatio: '1/1',
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    gap: '1rem',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      background: 'rgba(0, 210, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-blue)'
                    }}>
                      <Upload size={28} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Click to upload image</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>WebP, PNG, JPG up to 10MB</p>
                    </div>
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                type="submit" 
                className="neon-button" 
                disabled={actionLoading} 
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {actionLoading ? 'Processing...' : <><Save size={20} /> {isEditing ? 'Update Product' : 'Create Product'}</>}
              </button>
              <button 
                type="button" 
                className="glass" 
                style={{ width: '100%', padding: '1rem' }} 
                onClick={() => navigate('/admin/products')}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
