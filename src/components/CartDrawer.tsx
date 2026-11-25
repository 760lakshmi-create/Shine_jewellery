import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [, setLocation] = useLocation();

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-serif text-2xl">Your Selection</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center opacity-70">
              <ShoppingBag className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="font-serif text-xl mb-2">Your selection is empty</p>
              <p className="text-sm text-muted-foreground">Discover our collections to find your perfect piece.</p>
              <Button 
                variant="outline" 
                className="mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none px-8 font-sans tracking-widest uppercase text-xs"
                onClick={() => setIsCartOpen(false)}
              >
                Discover
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-24 h-24 bg-muted overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-lg leading-tight">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-xs uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm mt-1">{formatPrice(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-border">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm uppercase tracking-widest text-muted-foreground">Subtotal</span>
              <span className="font-serif text-2xl">{formatPrice(cartTotal)}</span>
            </div>
            <Button 
              className="w-full rounded-none h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-xs transition-all"
              onClick={() => {
                setIsCartOpen(false);
                setLocation('/checkout');
              }}
            >
              Proceed to Checkout
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Complimentary shipping and returns on all orders.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
