import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Ticket, 
  Settings,
  X,
  ChevronRight,
  Store
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Inventory', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', path: '/admin/users', icon: Users },
  { name: 'Promotions', path: '/admin/coupons', icon: Ticket },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="admin-sidebar glass" style={{
      width: '280px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.25rem',
      zIndex: 100,
      borderRight: '1px solid var(--glass-border)',
      borderRadius: 0,
      background: 'rgba(10, 10, 10, 0.4)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Brand Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--accent-blue)'
          }}>
            <span style={{ fontWeight: 900, color: 'white', fontSize: '1.2rem' }}>V</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>VIBEKART</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="mobile-only" style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <p style={{ 
          fontSize: '0.7rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em', 
          color: 'var(--text-secondary)', 
          fontWeight: 700,
          marginBottom: '0.5rem',
          paddingLeft: '0.75rem',
          opacity: 0.5
        }}>Main Menu</p>
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                textDecoration: 'none'
              }}
              onClick={onClose}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <item.icon size={20} style={{ color: isActive ? 'var(--accent-blue)' : 'inherit' }} />
                <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '0.95rem' }}>{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--glass-border)'
          }}
        >
          <Store size={20} />
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Storefront</span>
        </NavLink>
        
        <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', margin: 0 }}>Vibekart Admin</p>
            <p style={{ fontSize: '0.65rem', opacity: 0.4, margin: 0 }}>Version 2.4.0</p>
          </div>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: '#00ff66',
            boxShadow: '0 0 10px #00ff66'
          }}></div>
        </div>
      </div>
    </div>
  );
}
