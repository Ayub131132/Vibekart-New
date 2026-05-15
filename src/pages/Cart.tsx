import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { indiaData } from '../data/indiaData';
import toast from 'react-hot-toast';

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
          items: cart.map(item => ({ id: item.id, quantity: item.quantity })) 
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
                address: `${addressLine}, ${villageCity}, ${selectedDistrict}, ${selectedState} - ${pinCode}. Phone: ${phoneNumber}`
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

    if (paymentMethod === 'Razorpay') {
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
          paymentMethod
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
            style={{ fontSize: '1.2rem', opacity: 0.6 }}
          >
            ←
          </button>
        )}
        <h1 className="neon-text" style={{ fontSize: '1.8rem' }}>
          {step === 'cart' && `Your Cart (${cartCount})`}
          {step === 'address' && 'Delivery Address'}
          {step === 'payment' && 'Payment Method'}
        </h1>
      </div>
      
      <div className="cart-container">
        {/* Left Column: Flow Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {step === 'cart' && (
            cart.map((item) => (
              <div key={item.id} className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
                  <p style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>${item.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'var(--glass-bg)', borderRadius: '50%', color: 'white', width: '28px', height: '28px' }}>-</button>
                  <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'var(--glass-bg)', borderRadius: '50%', color: 'white', width: '28px', height: '28px' }}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ color: '#ff4b2b', fontWeight: 'bold', fontSize: '0.8rem' }}>×</button>
              </div>
            ))
          )}

          {step === 'address' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {dbUser?.addressLine && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button 
                    onClick={() => handleAddressSourceChange('saved')}
                    className="glass"
                    style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      border: addressSource === 'saved' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                      background: addressSource === 'saved' ? 'rgba(0, 210, 255, 0.1)' : 'var(--glass-bg)'
                    }}
                  >
                    Use Saved Address
                  </button>
                  <button 
                    onClick={() => handleAddressSourceChange('new')}
                    className="glass"
                    style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      border: addressSource === 'new' ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                      background: addressSource === 'new' ? 'rgba(0, 210, 255, 0.1)' : 'var(--glass-bg)'
                    }}
                  >
                    Enter New Address
                  </button>
                </div>
              )}

              {addressSource === 'saved' && dbUser?.addressLine ? (
                <div className="glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Saved Delivery Details</h3>
                  <div style={{ opacity: 0.9, lineHeight: '1.6' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: '0.25rem' }}>{dbUser.phoneNumber}</p>
                    <p>{dbUser.addressLine}</p>
                    <p>{dbUser.villageCity}, {dbUser.selectedDistrict}</p>
                    <p>{dbUser.selectedState} - {dbUser.pinCode}</p>
                  </div>
                </div>
              ) : (
                <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="glass"
                      style={{ width: '100%', padding: '0.8rem', color: 'white', border: errors.phoneNumber ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                    />
                    {errors.phoneNumber && <p style={{ color: '#ff4b2b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Address (House No, Street...)</label>
                    <input 
                      type="text" 
                      value={addressLine} 
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Flat/House No, Building, Street..."
                      className="glass"
                      style={{ width: '100%', padding: '0.8rem', color: 'white', border: errors.addressLine ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                    />
                    {errors.addressLine && <p style={{ color: '#ff4b2b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.addressLine}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Village / City</label>
                      <input 
                        type="text" 
                        value={villageCity} 
                        onChange={(e) => setVillageCity(e.target.value)}
                        placeholder="City name"
                        className="glass"
                        style={{ width: '100%', padding: '0.8rem', color: 'white', border: errors.villageCity ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                      />
                      {errors.villageCity && <p style={{ color: '#ff4b2b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.villageCity}</p>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>PIN Code</label>
                      <input 
                        type="text" 
                        value={pinCode} 
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="6-digit PIN"
                        maxLength={6}
                        className="glass"
                        style={{ width: '100%', padding: '0.8rem', color: 'white', border: errors.pinCode ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                      />
                      {errors.pinCode && <p style={{ color: '#ff4b2b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.pinCode}</p>}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>State</label>
                    <select 
                      value={selectedState}
                      onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                      className="glass"
                      style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'var(--bg-black)', border: errors.selectedState ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                    >
                      <option value="">Select State</option>
                      {Object.keys(indiaData).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.selectedState && <p style={{ color: '#ff4b2b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.selectedState}</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>District</label>
                    <select 
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedState}
                      className="glass"
                      style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'var(--bg-black)', opacity: !selectedState ? 0.5 : 1, border: errors.selectedDistrict ? '1px solid #ff4b2b' : '1px solid var(--glass-border)' }}
                    >
                      <option value="">Select District</option>
                      {selectedState && indiaData[selectedState].map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                    {errors.selectedDistrict && <p style={{ color: '#ff4b2b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.selectedDistrict}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && (
            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Choose your payment method</p>
              <div 
                onClick={() => setPaymentMethod('COD')}
                className="glass" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  cursor: 'pointer',
                  border: paymentMethod === 'COD' ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  border: '2px solid var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {paymentMethod === 'COD' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-blue)' }} />}
                </div>
                <span>Cash on Delivery</span>
              </div>

              <div 
                onClick={() => setPaymentMethod('Razorpay')}
                className="glass" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  cursor: 'pointer',
                  border: paymentMethod === 'Razorpay' ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)'
                }}
              >
                <div style={{ 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  border: '2px solid var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {paymentMethod === 'Razorpay' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-blue)' }} />}
                </div>
                <span>Online Payment (Razorpay)</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="glass cart-summary" style={{ padding: '2rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span>Shipping</span>
            <span style={{ color: 'var(--accent-blue)' }}>FREE</span>
          </div>
          <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <span>Total</span>
            <span className="neon-text">${cartTotal.toFixed(2)}</span>
          </div>
          
          {step === 'cart' && (
            <button className="neon-button" style={{ width: '100%', padding: '1rem' }} onClick={() => setStep('address')}>
              Checkout Now
            </button>
          )}

          {step === 'address' && (
            <button className="neon-button" style={{ width: '100%', padding: '1rem' }} onClick={handleNextToPayment}>
              Next: Payment
            </button>
          )}

          {step === 'payment' && (
            <button 
              className="neon-button" 
              style={{ width: '100%', padding: '1rem' }} 
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          )}

          {step !== 'cart' && (
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', opacity: 0.5 }}>
              Step {step === 'address' ? '1' : '2'} of 2
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
