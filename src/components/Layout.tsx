import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <div className="layout" style={{ minHeight: '100vh' }}>
        <header style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Link to="/" style={{ fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: '2px' }}>
            <span className="neon-text">VIBE</span>KART
          </Link>
        </header>

        <main style={{ padding: '1rem 2rem' }}>
          {children}
        </main>

        <footer style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
          &copy; 2026 Vibekart. Future-Proof Shopping.
        </footer>
      </div>
      <Navbar />
    </>
  );
}
