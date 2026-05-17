import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithCustomToken
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface DbUser {
  uid: string;
  numericUid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  totalOrders: number;
  bio: string;
  addressLine?: string;
  selectedState?: string;
  selectedDistrict?: string;
  villageCity?: string;
  pinCode?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  sendOTP: (email: string, type: 'login' | 'signup') => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<DbUser>, silent?: boolean) => Promise<void>;
  requestEmailChange: (newEmail: string) => Promise<void>;
  verifyEmailChange: (otp: string) => Promise<void>;
  createProfile: (userObj: User) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncUser = async (userObj: User) => {
    try {
      const tokenResult = await userObj.getIdTokenResult(true);
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
      setIsAdmin(!!tokenResult.claims.admin || userObj.email === superAdminEmail);
      const token = tokenResult.token;
      
      const res = await fetch(`${BACKEND_URL}/user-profile/${userObj.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[AUTH] Profile synced successfully:', {
          uid: data.uid,
          username: data.username,
          numericUid: data.numericUid,
          totalOrders: data.totalOrders
        });
        setDbUser(data);
        return data;
      } else if (res.status === 404) {
        console.warn('[AUTH] No profile found for user:', userObj.email);
        setDbUser(null);
        return null;
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error syncing user:', err);
      toast.error('Identity sync failed.', { id: 'auth-sync-error' });
      return null;
    }
  };

  const createProfile = async (userObj: User) => {
    try {
      const token = await userObj.getIdToken();
      const createRes = await fetch(`${BACKEND_URL}/create-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userObj.email,
          displayName: userObj.displayName,
          photoURL: userObj.photoURL
        }),
      });

      if (!createRes.ok) {
        const createErr = await createRes.json();
        throw new Error(createErr.message || 'Profile creation failed');
      }

      return await syncUser(userObj);
    } catch (err: any) {
      console.error('Create profile error:', err);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[AUTH] State Change:', currentUser ? `User logged in: ${currentUser.email}` : 'User logged out');
      if (currentUser) {
        setUser(currentUser);
        await syncUser(currentUser);
      } else {
        setUser(null);
        setDbUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const sendOTP = async (email: string, type: 'login' | 'signup') => {
    const response = await fetch(`${BACKEND_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to send OTP');
      } catch {
        throw new Error(errorText || 'Failed to send OTP');
      }
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    const response = await fetch(`${BACKEND_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to verify OTP');
      } catch {
        throw new Error(errorText || 'Failed to verify OTP');
      }
    }

    const { token } = await response.json();
    await signInWithCustomToken(auth, token);
  };

  const updateProfile = async (updates: Partial<DbUser>, silent = false) => {
    if (!user) return;
    const token = await user.getIdToken();
    try {
      const response = await fetch(`${BACKEND_URL}/update-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: user.uid, updates }),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      if (!silent) toast.success('Profile updated successfully!');
      await syncUser(user);
    } catch (err) {
      if (!silent) toast.error('Failed to save profile changes.');
      throw err;
    }
  };

  const requestEmailChange = async (newEmail: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`${BACKEND_URL}/request-email-change-otp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newEmail }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to request email change');
    }
  };

  const verifyEmailChange = async (otp: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`${BACKEND_URL}/verify-email-change`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ otp }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to verify email change');
    }

    // Force refresh the user to get new email in Auth token
    await user.getIdToken(true);
    await syncUser(user);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, dbUser, isAdmin, loading, loginWithGoogle, sendOTP, verifyOTP, logout, updateProfile,
      requestEmailChange, verifyEmailChange, createProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
