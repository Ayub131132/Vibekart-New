import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          textAlign: 'center',
          padding: '2rem',
          background: 'radial-gradient(circle at center, #1a0b2e 0%, #050505 100%)'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div className="neon-text" style={{ fontSize: '4rem', lineHeight: '1', marginBottom: '0.5rem' }}>404</div>
            <div className="neon-text" style={{ fontSize: '1.5rem', opacity: 0.8 }}>SYSTEM_CRASH_VIBE_LOST</div>
          </div>
          
          <div className="glass" style={{ padding: '2.5rem', maxWidth: '550px', border: '1px solid rgba(255, 75, 43, 0.3)' }}>
            <h2 style={{ marginBottom: '1rem', color: '#ff4b2b' }}>Unexpected Exception</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8, fontSize: '1.1rem' }}>
              The application encountered a critical error. Our cyber-monitors have been notified.
            </p>
            
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '1rem', 
              borderRadius: '8px', 
              textAlign: 'left',
              marginBottom: '2rem',
              borderLeft: '4px solid #ff4b2b'
            }}>
              <code style={{ 
                fontSize: '0.85rem', 
                color: '#ff4b2b', 
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {this.state.error?.name}: {this.state.error?.message}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="neon-button" 
                onClick={() => window.location.href = '/'}
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)' }}
              >
                BACK TO HOME
              </button>
              <button 
                className="neon-button" 
                onClick={() => window.location.reload()}
                style={{ flex: 1 }}
              >
                REBOOT SYSTEM
              </button>
            </div>
          </div>
          
          <p style={{ marginTop: '2rem', opacity: 0.4, fontSize: '0.8rem' }}>
            Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
