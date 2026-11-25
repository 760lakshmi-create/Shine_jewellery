import React, { useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { products, formatPrice } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ArrowLeft, Check, Shield, Truck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StorefrontProduct = { id: string; name: string; price: number; image: string; category: string; description: string; details?: string[]; largeImage?: string };
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isAdded, setIsAdded] = React.useState(false);
  const [sellerProduct, setSellerProduct] = React.useState<StorefrontProduct | null>(null);
  const [isLoadingSellerProduct, setIsLoadingSellerProduct] = React.useState(false);
  const staticProduct = products.find(p => p.id === params?.id);
  const product: StorefrontProduct | undefined = staticProduct || sellerProduct || undefined;

  useEffect(() => {
    if (!params?.id || staticProduct) {
      setSellerProduct(null);
      setIsLoadingSellerProduct(false);
      return;
    }
    const controller = new AbortController();
    setIsLoadingSellerProduct(true);
    fetch(`${API}/catalog/seller-products/${encodeURIComponent(params.id)}`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setSellerProduct(result); })
      .catch(() => { if (!controller.signal.aborted) setSellerProduct(null); })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingSellerProduct(false); });
    return () => controller.abort();
  }, [params?.id, staticProduct]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.id]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-serif text-4xl mb-4">{isLoadingSellerProduct ? 'Loading piece…' : 'Piece Not Found'}</h1>
        <Link href="/collections" className="border-b border-foreground uppercase tracking-widest text-xs">
          Return to Collections
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="pt-24 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        
        <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 md:mb-12">
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-widest text-xs">Back to Collections</span>
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Images */}
          <div className="flex flex-col gap-4">
            <div className="bg-muted aspect-[4/5] md:aspect-square overflow-hidden rounded-none relative">
              <img 
                src={product.largeImage || product.image} 
                alt={product.name} 
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            {/* If there are more images, we'd map them here. Since we have limited, just show the main one grandly */}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center animate-in fade-in slide-in-from-right-8 duration-700">
            <p className="uppercase tracking-[0.2em] text-xs text-muted-foreground mb-4">
              High Jewelry / {product.category}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4">{product.name}</h1>
            <p className="text-2xl font-serif mb-8">{formatPrice(product.price)}</p>
            
            <div className="prose prose-sm md:prose-base text-muted-foreground mb-10">
              <p className="font-serif leading-relaxed text-lg">{product.description}</p>
            </div>

            <div className="flex gap-4 mb-8">
              <Button 
                onClick={handleAdd}
                disabled={isAdded}
                className="flex-1 h-16 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-sm transition-all relative overflow-hidden"
              >
                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isAdded ? 'translate-y-0' : '-translate-y-full'}`}>
                  <Check className="w-5 h-5 mr-2" /> Added to Bag
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isAdded ? 'translate-y-full' : 'translate-y-0'}`}>
                  Place in Bag
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => toggleWishlist(product.id)}
                className="w-16 h-16 rounded-none border-border hover:bg-muted transition-colors flex items-center justify-center shrink-0"
              >
                <Heart className={cn("w-6 h-6 transition-colors", isInWishlist(product.id) ? "fill-primary text-primary" : "text-foreground")} />
              </Button>
            </div>

            <div className="border-t border-border pt-8 space-y-6">
              <h3 className="font-serif text-xl">The Details</h3>
              <ul className="space-y-3">
                {product.details?.map((detail, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-12 bg-muted/30 p-6">
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-xs uppercase tracking-widest font-semibold">Lifetime Warranty</span>
                <span className="text-xs text-muted-foreground">Certified authenticity</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-6 h-6 text-primary" />
                <span className="text-xs uppercase tracking-widest font-semibold">Secure Delivery</span>
                <span className="text-xs text-muted-foreground">Insured & complimentary</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
