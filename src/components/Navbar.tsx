import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, dbUser } = useAuth();

  const photoURL = dbUser?.photoURL || user?.photoURL;

  return (
    <nav className="glass" style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-around',
      gap: '1rem',
      zIndex: 1000,
      borderRadius: 'var(--border-radius-lg)',
    }}>
      <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.8rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🏠</span>
        Home
      </Link>
      <Link to="/cart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.8rem', position: 'relative' }}>
        <span style={{ fontSize: '1.2rem' }}>🛒</span>
        Cart
        {cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-10px',
            background: 'var(--accent-blue)',
            color: 'black',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
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
      <Link to="/orders" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.8rem' }}>
        <span style={{ fontSize: '1.2rem' }}>📦</span>
        Orders
      </Link>
      <Link to="/profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.8rem' }}>
        {photoURL ? (
          <img 
            key={photoURL} // Key forces re-render if URL changes (useful for cache-busting if same URL)
            src={photoURL} 
            alt="P" 
            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
          />
        ) : (
          <span style={{ fontSize: '1.2rem' }}>👤</span>
        )}
        Profile
      </Link>
    </nav>
  );
}
