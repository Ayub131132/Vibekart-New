import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignupLink, setShowSignupLink] = useState(false);
  
  const { loginWithGoogle, sendOTP, verifyOTP, user, dbUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/profile';

  const handleGoogleAuth = async () => {
    setError('');
    setShowSignupLink(false);
    try {
      await loginWithGoogle();
    } catch {
      setError('Failed to login with Google');
      toast.error('Google login failed');
    }
  };

  // Centralized redirection logic
  useEffect(() => {
    if (authLoading) return;

    if (user && !dbUser) {
      setError('Account not found in database. Please register first.');
      setShowSignupLink(true);
      logout(); 
    } else if (user && dbUser) {
      navigate(redirectTo);
    }
  }, [user, dbUser, authLoading, navigate, logout, redirectTo]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSignupLink(false);

    try {
      await sendOTP(email, 'login');
      setStep(2);
      toast.success('OTP sent! Check your inbox.');
    } catch (err: any) {
      if (err.message.includes('User not found')) {
        setShowSignupLink(true);
      }
      setError(err.message || 'Action failed');
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOTP(email, otp);
      toast.success('Access Granted. Vibe secured.');
      // The useEffect will handle the redirect once sync completes
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      toast.error('Invalid OTP. Try again.');
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setError('');
    setShowSignupLink(false);
  };

  return (
    <div className="page page-transition" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="neon-text" style={{ marginBottom: '2rem' }}>Welcome Back</h1>
      
      <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {step === 1 && (
          <>
            <button 
              onClick={handleGoogleAuth}
              className="neon-button" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'white', color: 'black' }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
              <hr style={{ flex: 1, border: '0.5px solid var(--glass-border)' }} />
              <span>or</span>
              <hr style={{ flex: 1, border: '0.5px solid var(--glass-border)' }} />
            </div>

            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass"
                style={{ padding: '0.8rem', width: '100%', color: 'white', border: '1px solid var(--glass-border)' }}
              />
              <button type="submit" className="neon-button" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Processing...' : 'Send Login OTP'}
              </button>
            </form>

            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)' }}>Sign Up</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>Verification code sent to <strong>{email}</strong></p>
            <input 
              type="text" 
              placeholder="6-digit OTP" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="glass"
              style={{ padding: '0.8rem', width: '100%', color: 'white', border: '1px solid var(--glass-border)', textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem' }}
            />
            <button type="submit" className="neon-button" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button 
              type="button" 
              onClick={resetFlow} 
              style={{ background: 'none', color: 'var(--accent-blue)', fontSize: '0.9rem' }}
            >
              Back
            </button>
          </form>
        )}

        {error && (
          <div style={{ color: '#ff4b2b', fontSize: '0.9rem' }}>
            {error}
            {showSignupLink && (
              <p style={{ marginTop: '0.5rem' }}>
                <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                  Create a new account here
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
