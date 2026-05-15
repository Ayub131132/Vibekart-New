import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const useNotifications = () => {
  const { user } = useAuth();

  const saveTokenToBackend = async (fcmToken: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`${BACKEND_URL}/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid: user.uid,
          updates: { fcmToken }
        })
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          console.log('FCM Token:', token);
          saveTokenToBackend(token);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    if (user) {
      requestPermission();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
          icon: '🔔',
          duration: 5000,
        });
      }
    });

    return () => unsubscribe();
  }, []);
};
