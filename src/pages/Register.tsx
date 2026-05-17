import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { loginWithGoogle, sendOTP, verifyOTP, user, dbUser, createProfile } = useAuth();
  const navigate = useNavigate();

  // If already logged in AND has profile, redirect
  if (user && dbUser) {
    navigate('/profile');
    return null;
  }

  const handleGoogleAuth = async () => {
    setError('');
    try {
      await loginWithGoogle();
      // AuthContext will call syncUser. 
      // If it's a new user, syncUser will set dbUser to null.
      // We should check and create profile.
    } catch {
      setError('Failed to signup with Google');
      toast.error('Google signup failed');
    }
  };

  // Add an effect to handle profile creation for Google signup
  useEffect(() => {
    const handleGoogleRegistration = async () => {
      if (user && !loading && !dbUser) {
        try {
          await createProfile(user);
          toast.success('Account created! Welcome to Vibekart.');
          navigate('/profile');
        } catch (err: any) {
          setError(err.message || 'Failed to create profile');
        }
      } else if (user && dbUser) {
        toast.success('Welcome back, Vibe Member!');
        navigate('/profile');
      }
    };
    
    handleGoogleRegistration();
  }, [user, dbUser, loading, navigate, createProfile]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendOTP(email, 'signup');
      setStep(2);
      toast.success('OTP sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
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
      toast.success('Account created! Welcome to Vibekart.');
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      toast.error('Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setError('');
  };

  return (
    <div className="page page-transition" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="neon-text" style={{ marginBottom: '2rem' }}>Create Account</h1>
      
      <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {step === 1 && (
          <>
            <button 
              onClick={handleGoogleAuth}
              className="neon-button" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'white', color: 'black' }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
              Sign up with Google
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
                {loading ? 'Processing...' : 'Send Signup OTP'}
              </button>
            </form>

            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)' }}>Log In</Link>
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
              {loading ? 'Verifying...' : 'Verify & Signup'}
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

        {error && <div style={{ color: '#ff4b2b', fontSize: '0.9rem' }}>{error}</div>}
      </div>
    </div>
  );
}
