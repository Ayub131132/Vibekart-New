import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="neon-text" style={{ 
          fontSize: '8rem', 
          lineHeight: '1', 
          fontWeight: 900,
          opacity: 0.1,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          zIndex: 0
        }}>
          404
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AlertTriangle size={80} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
          <h1 className="neon-text" style={{ fontSize: '3rem', fontWeight: 900 }}>404</h1>
        </div>
      </div>

      <div className="glass" style={{ padding: '2.5rem', maxWidth: '500px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ marginBottom: '1rem', color: 'white' }}>Oops! The page you're looking for doesn't exist.</h2>
        <p style={{ marginBottom: '2rem', opacity: 0.6, fontSize: '1.1rem' }}>
          It seems you've wandered into a dead sector of the matrix. 
          The vibe you're searching for has either moved or never existed.
        </p>
        
        <Link to="/" className="neon-button" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '0.8rem 2rem'
        }}>
          <Home size={20} />
          Return to Home
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.05); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.1; }
        }
        .neon-text:first-child {
          animation: pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
