import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import Skeleton from '../../components/Skeleton';
import { Search, User, Mail, Calendar, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  totalOrders: number;
  createdAt: { _seconds: number };
}

export default function UserManagement() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${BACKEND_URL}/admin/all-users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Fetch users error:', err);
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchUsers();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="page-transition">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Users</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your customer base</p>
          </div>
        </div>

        {/* Search */}
        <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              className="glass" 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'transparent' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="glass" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem' }}><Skeleton height="400px" /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1.25rem' }}>User</th>
                  <th style={{ padding: '1.25rem' }}>Email</th>
                  <th style={{ padding: '1.25rem' }}>Total Orders</th>
                  <th style={{ padding: '1.25rem' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.uid} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {u.photoURL ? (
                          <img src={u.photoURL} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="white" />
                          </div>
                        )}
                        <span style={{ fontWeight: 500 }}>{u.displayName || 'Unnamed User'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Mail size={14} />
                        {u.email}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hash size={14} style={{ color: 'var(--accent-blue)' }} />
                        {u.totalOrders || 0} orders
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                        <Calendar size={14} />
                        {u.createdAt ? new Date(u.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
