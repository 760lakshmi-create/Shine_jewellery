import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { products, formatPrice } from '@/data/products';
import { Link } from 'wouter';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Wishlist() {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  const savedProducts = products.filter(p => wishlistItems.includes(p.id));

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Your Wishlist</h1>
        <p className="text-muted-foreground font-serif text-lg">
          Curated pieces saved for future milestones.
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-t border-border">
          <p className="font-serif text-2xl mb-6 text-muted-foreground">Your wishlist is currently empty.</p>
          <Link href="/collections">
            <Button className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-xs px-12 h-14">
              Explore Collections
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {savedProducts.map((product) => (
            <div key={product.id} className="group relative border border-border p-4 bg-card flex flex-col">
              <button 
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-6 right-6 z-10 text-muted-foreground hover:text-foreground transition-colors"
                title="Remove from wishlist"
              >
                <X className="w-5 h-5" />
              </button>
              
              <Link href={`/product/${product.id}`} className="block mb-6 relative aspect-square bg-muted overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                />
              </Link>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-xl mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                </div>
                
                <Button 
                  onClick={() => addToCart(product)}
                  variant="outline"
                  className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-[0.2em] uppercase text-xs flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Bag
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
