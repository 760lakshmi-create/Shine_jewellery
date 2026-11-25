import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

async function readApiResponse(response: Response) {
  const text = await response.text();
  let result: any;
  try { result = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`Server returned an invalid response (HTTP ${response.status}). Check that the API is running at ${API}.`); }
  if (!response.ok) throw new Error(result.message || `Request failed (HTTP ${response.status}).`);
  return result;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: ''
  });

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <h1 className="font-serif text-3xl mb-4">Your Selection is Empty</h1>
        <Link href="/collections" className="border-b border-foreground uppercase tracking-widest text-xs">
          Return to Collections
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 bg-background text-center px-4 animate-in fade-in duration-1000">
        <CheckCircle2 className="w-16 h-16 text-primary mb-8" />
        <h1 className="font-serif text-4xl md:text-5xl mb-4">Order Confirmed</h1>
        <p className="text-muted-foreground font-serif text-lg mb-2">Thank you, {formData.firstName}.</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-12">
          Your eternal piece is being prepared with the utmost care. You will receive an email confirmation at {formData.email} shortly.
        </p>
        {createdOrderId && <Button
          onClick={() => { sessionStorage.setItem('shine_tracking_email', formData.email); setLocation(`/track-order/${createdOrderId}`); }}
          className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-xs px-12 h-14 mb-3"
        >
          Track your order
        </Button>}
        <Button
          onClick={() => setLocation('/')}
          variant="outline"
          className="rounded-none border-primary text-primary hover:bg-muted font-sans tracking-[0.2em] uppercase text-xs px-12 h-14"
        >
          Return to Boutique
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay checkout load nahi ho saka.'));
      });

      const response = await fetch(`${API}/payment/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotal }),
      });
      const result = await readApiResponse(response);
      if (!result.order?.id || !result.order?.amount) throw new Error('Payment order response incomplete hai. API server restart karke dobara try karein.');

      await new Promise<void>((resolve, reject) => {
        const payment = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: result.order.amount,
          currency: result.order.currency,
          name: 'Shine Jewelry',
          description: 'Jewelry purchase',
          order_id: result.order.id,
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
          },
          handler: async (paymentResult: Record<string, string>) => {
            try {
              const verifyResponse = await fetch(`${API}/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...paymentResult, customer: formData, items, total: cartTotal }),
              });
              const verifyResult = await readApiResponse(verifyResponse);
              if (!verifyResult.orderId) throw new Error('Payment verify hua, lekin order ID response mein nahi mila. Support se sampark karein.');
              setCreatedOrderId(verifyResult.orderId || '');
              sessionStorage.setItem('shine_tracking_email', formData.email);
              setIsSuccess(true);
              clearCart();
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancel kar diya gaya.')) },
        });
        payment.open();
      });
    } catch (error) {
      console.error('Failed to save order', error);
      window.alert(error instanceof Error ? error.message : 'Payment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-muted/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        <div className="flex items-center text-xs uppercase tracking-widest text-muted-foreground mb-12">
          <Link href="/cart" className="hover:text-foreground">Cart</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-foreground font-semibold">Checkout</span>
        </div>

        <h1 className="font-serif text-4xl mb-12">Secure Checkout</h1>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              <section>
                <h2 className="font-serif text-2xl mb-6 border-b border-border pb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
                    <input 
                      required
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-6 border-b border-border pb-4">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">First Name</label>
                    <input 
                      required
                      type="text" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Last Name</label>
                    <input 
                      required
                      type="text" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Address</label>
                    <input 
                      required
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">City</label>
                    <input 
                      required
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Postal Code</label>
                    <input 
                      required
                      type="text" 
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-serif text-2xl mb-6 border-b border-border pb-4">Payment</h2>
                <div className="bg-background border border-border p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-serif mb-2">Secure Payment Environment</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Razorpay ke through UPI, PhonePe, Google Pay, BHIM aur other supported payment options available hain.
                  </p>
                </div>
              </section>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-sm transition-all relative"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Pay ${formatPrice(cartTotal)}`
                )}
              </Button>

            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-background border border-border p-6 md:p-8 sticky top-32">
              <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
              
              <div className="space-y-6 mb-8">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-muted overflow-hidden shrink-0 border border-border">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-serif text-base">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      <p className="text-sm mt-2">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-6 space-y-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Insured Shipping</span>
                  <span className="uppercase text-xs tracking-widest text-primary">Complimentary</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-serif text-2xl pt-4 border-t border-border text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
