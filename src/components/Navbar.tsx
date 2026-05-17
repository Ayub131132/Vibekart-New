import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Home, ShoppingCart, Package, User } from 'lucide-react';

const Navbar = memo(() => {
  const { cartCount } = useCart();
  const { user, dbUser } = useAuth();
  const location = useLocation();

  const photoURL = dbUser?.photoURL || user?.photoURL;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass" style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'space-around',
      gap: '0.5rem',
      zIndex: 1000,
      borderRadius: 'var(--border-radius-lg)',
    }}>
      <Link to="/" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontSize: '0.7rem',
        color: isActive('/') ? 'var(--accent-blue)' : 'white',
        transition: 'color 0.3s ease'
      }}>
        <Home size={20} style={{ marginBottom: '4px' }} />
        Home
      </Link>
      <Link to="/cart" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontSize: '0.7rem', 
        position: 'relative',
        color: isActive('/cart') ? 'var(--accent-blue)' : 'white',
        transition: 'color 0.3s ease'
      }}>
        <ShoppingCart size={20} style={{ marginBottom: '4px' }} />
        Cart
        {cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '0',
            background: 'var(--accent-blue)',
            color: 'black',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 0 10px var(--accent-blue)',
          }}>
            {cartCount}
          </span>
        )}
      </Link>
      <Link to="/orders" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontSize: '0.7rem',
        color: isActive('/orders') ? 'var(--accent-blue)' : 'white',
        transition: 'color 0.3s ease'
      }}>
        <Package size={20} style={{ marginBottom: '4px' }} />
        Orders
      </Link>
      <Link to="/profile" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        fontSize: '0.7rem',
        color: isActive('/profile') ? 'var(--accent-blue)' : 'white',
        transition: 'color 0.3s ease'
      }}>
        {photoURL ? (
          <img 
            key={photoURL} 
            src={photoURL} 
            alt="P" 
            style={{ 
              width: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              marginBottom: '4px',
              border: isActive('/profile') ? '1px solid var(--accent-blue)' : '1px solid transparent'
            }} 
          />
        ) : (
          <User size={20} style={{ marginBottom: '4px' }} />
        )}
        Profile
      </Link>
    </nav>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;
