import type { ReactNode } from 'react';
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-black)' }}>
      {/* Sidebar for Desktop */}
      <div className="desktop-only">
        <AdminSidebar />
      </div>

      {/* Sidebar for Mobile */}
      {isSidebarOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setIsSidebarOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '260px', height: '100%' }}>
            <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Admin Header */}
        <header style={{
          height: '70px',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(5, 5, 5, 0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <button 
            className="mobile-only" 
            onClick={() => setIsSidebarOpen(true)}
            style={{ padding: '0.5rem' }}
          >
            <Menu size={24} />
          </button>

          <div className="desktop-only">
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Dashboard Overview</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ position: 'relative', color: 'var(--text-secondary)' }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: '8px',
                height: '8px',
                background: 'var(--accent-blue)',
                borderRadius: '50%',
                border: '2px solid var(--bg-black)'
              }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }} className="desktop-only">
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Admin</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'var(--accent-neon)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} color="white" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{ padding: '2rem', flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 1025px) {
          .mobile-only { display: none; }
        }
        @media (max-width: 1024px) {
          .desktop-only { display: none; }
          .admin-sidebar { position: fixed; height: 100vh; }
        }
      `}</style>
    </div>
  );
}
