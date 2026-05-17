import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { indiaData } from '../data/indiaData';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  X, 
  CreditCard, 
  Truck, 
  ShoppingBag,
  ChevronRight,
  Ticket,
  CheckCircle2
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

type CheckoutStep = 'cart' | 'address' | 'payment';

declare global {
  interface Window {
    Razorpay: new (options: any) => { open: () => void };
  }
}

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
  const { user, dbUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [loading, setLoading] = useState(false);
  const [addressSource, setAddressSource] = useState<'saved' | 'new'>('new');

  // Address State
  const [addressLine, setAddressLine] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [villageCity, setVillageCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Pre-fill address if exists in dbUser
  useEffect(() => {
    if (dbUser && dbUser.addressLine) {
      setAddressSource('saved');
      setAddressLine(dbUser.addressLine);
      setSelectedState(dbUser.selectedState || '');
      setSelectedDistrict(dbUser.selectedDistrict || '');
      setVillageCity(dbUser.villageCity || '');
      setPinCode(dbUser.pinCode || '');
      setPhoneNumber(dbUser.phoneNumber || '');
    } else {
      setAddressSource('new');
    }
  }, [dbUser]);

  const handleAddressSourceChange = (source: 'saved' | 'new') => {
    setAddressSource(source);
    if (source === 'new') {
      setAddressLine('');
      setSelectedState('');
      setSelectedDistrict('');
      setVillageCity('');
      setPinCode('');
      setPhoneNumber('');
    } else if (dbUser) {
      setAddressLine(dbUser.addressLine || '');
      setSelectedState(dbUser.selectedState || '');
      setSelectedDistrict(dbUser.selectedDistrict || '');
      setVillageCity(dbUser.villageCity || '');
      setPinCode(dbUser.pinCode || '');
      setPhoneNumber(dbUser.phoneNumber || '');
    }
  };

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, type: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleVerifyCoupon = async () => {
    if (!couponInput) return;
    setCouponLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/verify-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponInput }),
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon(data);
        toast.success(`Coupon "${data.code}" applied!`);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      toast.error('Failed to verify coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!appliedCoupon) return cartTotal;
    if (appliedCoupon.type === 'fixed') {
      return Math.max(0, cartTotal - appliedCoupon.discount);
    }
    return cartTotal * (1 - appliedCoupon.discount / 100);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
          couponCode: appliedCoupon?.code
        }),
      });

      if (!res.ok) throw new Error('Failed to create Razorpay order');
      const orderData = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vibekart',
        description: 'Vibe Payment',
        order_id: orderData.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ...response,
                items: cart,
                address: `${addressLine}, ${villageCity}, ${selectedDistrict}, ${selectedState} - ${pinCode}. Phone: ${phoneNumber}`,
                couponCode: appliedCoupon?.code
              }),
            });

            if (verifyRes.ok) {
              // Save address to profile if not already saved or if changed
              await updateProfile({
                addressLine,
                selectedState,
                selectedDistrict,
                villageCity,
                pinCode,
                phoneNumber
              }, true);
              clearCart();
              toast.success('Payment Successful! Order secured.');
              navigate('/orders');
            } else {
              try {
                const errorData = await verifyRes.json();
                toast.error(`Payment verification failed: ${errorData.message || 'Unknown error'}`);
              } catch {
                const errorText = await verifyRes.text();
                toast.error(`Payment verification failed: ${errorText}`);
              }
            }
          } catch {
            toast.error('Error verifying payment.');
          }
        },
        prefill: {
          email: user?.email,
          contact: phoneNumber
        },
        theme: {
          color: '#00d2ff'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Failed to initiate Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};

    if (addressLine.length < 5) newErrors.addressLine = 'Address must be at least 5 characters long';
    if (!selectedState) newErrors.selectedState = 'Please select a state';
    if (!selectedDistrict) newErrors.selectedDistrict = 'Please select a district';
    if (villageCity.length < 3) newErrors.villageCity = 'City/Village must be at least 3 characters long';
    
    if (!/^\d{6}$/.test(pinCode)) newErrors.pinCode = 'Enter a valid 6-digit PIN code';
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) newErrors.phoneNumber = 'Enter a valid 10-digit Indian phone number';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in your address');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleNextToPayment = () => {
    if (validateAddress()) {
      setStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const currentTotal = calculateTotal();
    const finalPaymentMethod = currentTotal <= 0 ? 'FREE_COUPON' : paymentMethod;

    if (finalPaymentMethod === 'Razorpay') {
      await handleRazorpayPayment();
      return;
    }

    setLoading(true);
    const fullAddress = `${addressLine}, ${villageCity}, ${selectedDistrict}, ${selectedState} - ${pinCode}. Phone: ${phoneNumber}`;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/place-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          address: fullAddress,
          paymentMethod: finalPaymentMethod,
          couponCode: appliedCoupon?.code
        }),
      });

      if (res.ok) {
        // Save address to profile if not already saved or if changed
        await updateProfile({
          addressLine,
          selectedState,
          selectedDistrict,
          villageCity,
          pinCode,
          phoneNumber
        }, true);
        clearCart();
        toast.success('Vibe Check Passed! Order placed successfully.');
        navigate('/orders');
      } else {
        try {
          const errorData = await res.json();
          toast.error(`Failed to place order: ${errorData.message || 'Unknown error'}`);
        } catch {
          const errorText = await res.text();
          toast.error(`Failed to place order: ${errorText}`);
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred during checkout. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Your cart is empty</h2>
        <Link to="/" className="neon-button">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page page-transition">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {step !== 'cart' && (
          <button 
            onClick={() => setStep(step === 'payment' ? 'address' : 'cart')}
            style={{ 
              background: 'var(--glass-bg)', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="neon-text" style={{ fontSize: '1.8rem' }}>
          {step === 'cart' && `Your Cart (${cartCount})`}
          {step === 'address' && 'Delivery Address'}
          {step === 'payment' && 'Payment Method'}
        </h1>
      </div>
      
      <div className="cart-container" style={{ paddingBottom: '8rem' }}>
        {/* Left Column: Flow Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {step === 'cart' && (
            cart.map((item) => (
              <div 
                key={item.id} 
                className="glass" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  gap: '1.25rem', 
                  alignItems: 'center',
                  borderRadius: 'var(--border-radius-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* 1. Image Container */}
                <div style={{ 
                  width: '90px', 
                  height: '90px', 
                  minWidth: '90px', 
                  borderRadius: 'var(--border-radius-sm)',
                  overflow: 'hidden',
                  background: 'var(--bg-dark-gray)'
                }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Vibe';
                    }}
                  />
                </div>

                {/* 2. Product Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'white'
                  }}>
                    {item.name}
                  </h3>
                  <p style={{ 
                    color: 'var(--accent-blue)', 
                    fontWeight: 800,
                    fontSize: '1rem'
                  }}>
                    ₹{item.price.toLocaleString()}
                  </p>
                  
                  {/* 3. Quantity Controls (Mobile-friendly) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                      className="glass"
                      style={{ 
                        borderRadius: '50%', 
                        color: 'white', 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Minus size={14} />
                    </button>
                    
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                      {item.quantity}
                    </span>
                    
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                      className="glass"
                      style={{ 
                        borderRadius: '50%', 
                        color: 'white', 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* 4. Remove Button (Positioned cleanly) */}
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  style={{ 
                    color: 'rgba(255, 75, 43, 0.6)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '0.5rem',
                    transition: 'color 0.2s',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff4b2b'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 75, 43, 0.6)'}
                >
                  <X size={20} />
                </button>
              </div>
            ))
          )}

          {step === 'address' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {dbUser?.addressLine && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <button 
                    onClick={() => handleAddressSourceChange('saved')}
                    className="glass"
                    style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      border: addressSource === 'saved' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                      background: addressSource === 'saved' ? 'rgba(0, 210, 255, 0.1)' : 'var(--glass-bg)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Use Saved
                  </button>
                  <button 
                    onClick={() => handleAddressSourceChange('new')}
                    className="glass"
                    style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      border: addressSource === 'new' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                      background: addressSource === 'new' ? 'rgba(0, 210, 255, 0.1)' : 'var(--glass-bg)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    New Address
                  </button>
                </div>
              )}

              {addressSource === 'saved' && dbUser?.addressLine ? (
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>Delivery Details</h3>
                  <div style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '0.95rem' }}>
                    <p style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>{dbUser.phoneNumber}</p>
                    <p>{dbUser.addressLine}</p>
                    <p>{dbUser.villageCity}, {dbUser.selectedDistrict}</p>
                    <p>{dbUser.selectedState} - {dbUser.pinCode}</p>
                  </div>
                </div>
              ) : (
                <div className="glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, letterSpacing: '0.5px' }}>PHONE NUMBER</label>
                    <input 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="glass"
                      style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: '12px', border: errors.phoneNumber ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                    />
                    {errors.phoneNumber && <p style={{ color: '#ff4b2b', fontSize: '0.75rem' }}>{errors.phoneNumber}</p>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, letterSpacing: '0.5px' }}>FULL ADDRESS</label>
                    <input 
                      type="text" 
                      value={addressLine} 
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="House No, Building, Street..."
                      className="glass"
                      style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: '12px', border: errors.addressLine ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                    />
                    {errors.addressLine && <p style={{ color: '#ff4b2b', fontSize: '0.75rem' }}>{errors.addressLine}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, letterSpacing: '0.5px' }}>CITY</label>
                      <input 
                        type="text" 
                        value={villageCity} 
                        onChange={(e) => setVillageCity(e.target.value)}
                        placeholder="City name"
                        className="glass"
                        style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: '12px', border: errors.villageCity ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                      />
                      {errors.villageCity && <p style={{ color: '#ff4b2b', fontSize: '0.75rem' }}>{errors.villageCity}</p>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, letterSpacing: '0.5px' }}>PIN CODE</label>
                      <input 
                        type="text" 
                        value={pinCode} 
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="6-digit PIN"
                        maxLength={6}
                        className="glass"
                        style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: '12px', border: errors.pinCode ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                      />
                      {errors.pinCode && <p style={{ color: '#ff4b2b', fontSize: '0.75rem' }}>{errors.pinCode}</p>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, letterSpacing: '0.5px' }}>STATE</label>
                      <select 
                        value={selectedState}
                        onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                        className="glass"
                        style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: '12px', background: 'var(--bg-black)', border: errors.selectedState ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                      >
                        <option value="">Select State</option>
                        {Object.keys(indiaData).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.selectedState && <p style={{ color: '#ff4b2b', fontSize: '0.75rem' }}>{errors.selectedState}</p>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, letterSpacing: '0.5px' }}>DISTRICT</label>
                      <select 
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        disabled={!selectedState}
                        className="glass"
                        style={{ width: '100%', padding: '1rem', color: 'white', borderRadius: '12px', background: 'var(--bg-black)', opacity: !selectedState ? 0.5 : 1, border: errors.selectedDistrict ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                      >
                        <option value="">Select District</option>
                        {selectedState && indiaData[selectedState].map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                      {errors.selectedDistrict && <p style={{ color: '#ff4b2b', fontSize: '0.75rem' }}>{errors.selectedDistrict}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Coupon Box */}
              <div className="glass" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white' }}>
                  <Ticket size={20} style={{ color: 'var(--accent-blue)' }} /> Apply Promo Code
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Enter code (e.g. VIBE20)" 
                      className="glass" 
                      style={{ 
                        width: '100%', 
                        padding: '0.9rem 1.25rem', 
                        color: 'white',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        fontSize: '0.95rem',
                        border: appliedCoupon ? '1px solid var(--success-green)' : '1px solid var(--glass-border)',
                        boxShadow: appliedCoupon ? '0 0 10px rgba(0, 255, 102, 0.1)' : 'none'
                      }} 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon && (
                      <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--success-green)' }}>
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                  </div>
                  {appliedCoupon ? (
                    <button 
                      onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                      className="glass"
                      style={{ padding: '0 1.5rem', color: '#ff4b2b', fontSize: '0.9rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(255, 75, 43, 0.2)' }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      onClick={handleVerifyCoupon}
                      className="neon-button"
                      disabled={!couponInput || couponLoading}
                      style={{ padding: '0 1.75rem', borderRadius: '12px', opacity: !couponInput || couponLoading ? 0.5 : 1, fontSize: '0.9rem' }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--success-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={14} /> Successfully applied {appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : `₹${appliedCoupon.discount}`} discount!
                  </p>
                )}
              </div>

              <div className="glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.6, marginBottom: '0.25rem', letterSpacing: '0.5px' }}>CHOOSE PAYMENT METHOD</p>
                
                <div 
                  onClick={() => setPaymentMethod('COD')}
                  className="glass" 
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.25rem', 
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    border: paymentMethod === 'COD' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'COD' ? 'rgba(0, 210, 255, 0.05)' : 'transparent'
                  }}
                >
                  <div style={{ 
                    width: '22px', 
                    height: '22px', 
                    borderRadius: '50%', 
                    border: '2px solid var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: paymentMethod === 'COD' ? 'var(--accent-blue)' : 'transparent'
                  }}>
                    {paymentMethod === 'COD' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'black' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                      <Truck size={22} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>Cash on Delivery</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Pay securely at your doorstep</p>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('Razorpay')}
                  className="glass" 
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.25rem', 
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    border: paymentMethod === 'Razorpay' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                    background: paymentMethod === 'Razorpay' ? 'rgba(0, 210, 255, 0.05)' : 'transparent'
                  }}
                >
                  <div style={{ 
                    width: '22px', 
                    height: '22px', 
                    borderRadius: '50%', 
                    border: '2px solid var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: paymentMethod === 'Razorpay' ? 'var(--accent-blue)' : 'transparent'
                  }}>
                    {paymentMethod === 'Razorpay' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'black' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
                      <CreditCard size={22} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>Online Payment</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>UPI, Cards, and Netbanking via Razorpay</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

        {/* Right Column: Order Summary & Action */}
        <div className="glass cart-summary" style={{ 
          padding: '2.25rem', 
          position: 'sticky', 
          top: '2rem', 
          height: 'fit-content',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          marginBottom: '4rem' // Add spacing for bottom nav
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
            <ShoppingBag size={22} style={{ color: 'var(--accent-blue)' }} /> Order Summary
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', opacity: 0.7 }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{cartTotal.toFixed(2)}</span>
            </div>
            
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--success-green)', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Ticket size={16} /> Discount ({appliedCoupon.code})
                </span>
                <span>
                  -₹{appliedCoupon.type === 'percentage' 
                    ? (cartTotal * appliedCoupon.discount / 100).toFixed(2) 
                    : appliedCoupon.discount.toFixed(2)}
                </span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', opacity: 0.7 }}>
              <span>Shipping</span>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>FREE</span>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.8 }}>Total Amount</span>
            <span className="neon-text" style={{ fontSize: '1.8rem', fontWeight: 900 }}>₹{calculateTotal().toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {step === 'cart' && (
              <button className="neon-button" style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', borderRadius: '12px' }} onClick={() => setStep('address')}>
                Proceed to Address <ChevronRight size={20} />
              </button>
            )}

            {step === 'address' && (
              <button className="neon-button" style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', borderRadius: '12px' }} onClick={handleNextToPayment}>
                Select Payment <ChevronRight size={20} />
              </button>
            )}

            {step === 'payment' && (
              <button 
                className="neon-button" 
                style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', borderRadius: '12px', background: 'var(--accent-neon)' }} 
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? 'Processing...' : <><CreditCard size={20} /> Confirm Order</>}
              </button>
            )}
          </div>

          {step !== 'cart' && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: 0.4 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: step === 'address' ? 'var(--accent-blue)' : 'white' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: step === 'payment' ? 'var(--accent-blue)' : 'white' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '4px' }}>
                Step {step === 'address' ? '1' : '2'} of 2
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Recently Ordered Section fallback space */}
      <style>{`
        .cart-container {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .cart-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .cart-summary {
            position: relative !important;
            top: 0 !important;
            margin-bottom: 6rem !important;
          }
        }

        @media (max-width: 640px) {
          .cart-page {
            padding: 1rem 0.5rem;
          }
          
          .glass {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
