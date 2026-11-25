import React, { useEffect, useMemo, useState } from 'react';
import { products, formatPrice } from '@/data/products';
import { Link } from 'wouter';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

type StorefrontProduct = { id: string; name: string; category: string; price: number; image: string; largeImage?: string; description: string; details: string[] };
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Collections() {
  const [filter, setFilter] = useState<string>('all');
  const [sellerProducts, setSellerProducts] = useState<StorefrontProduct[]>([]);
  const [sellerProductsUnavailable, setSellerProductsUnavailable] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/catalog/seller-products`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load seller products.');
        return result as StorefrontProduct[];
      })
      .then((items) => { if (!cancelled) setSellerProducts(items); })
      .catch(() => { if (!cancelled) setSellerProductsUnavailable(true); });
    return () => { cancelled = true; };
  }, []);
  
  const categories = ['all', 'high-jewelry', 'necklaces', 'rings', 'bracelets', 'earrings'];
  
  const allProducts = useMemo(() => [...products, ...sellerProducts], [sellerProducts]);
  const filteredProducts = filter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === filter);

  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h1 className="font-serif text-5xl md:text-6xl mb-6">Collections</h1>
        <p className="text-muted-foreground max-w-xl mx-auto font-serif text-lg">
          Explore our complete repertoire of fine jewelry. Each piece is an invitation to celebrate life's most luminous moments.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-8 mb-16 overflow-x-auto pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`uppercase tracking-widest text-xs font-semibold pb-2 border-b-2 transition-all whitespace-nowrap ${
              filter === cat 
                ? 'border-primary text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'all' ? 'All Pieces' : cat}
          </button>
        ))}
      </div>

      {sellerProductsUnavailable && <p className="text-center text-xs text-muted-foreground -mt-10 mb-8">Some independent seller items may not be available until the catalogue reconnects.</p>}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {filteredProducts.map((product, i) => (
          <div key={product.id} className="group relative">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(product.id);
                }}
                className="p-2 bg-background/50 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
              >
                <Heart className={cn("w-4 h-4 transition-colors", isInWishlist(product.id) ? "fill-primary text-primary" : "text-foreground")} />
              </button>
            </div>
            <Link href={`/product/${product.id}`} className="cursor-pointer block">
              <div className="relative aspect-[4/5] bg-muted mb-6 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-1000 ease-out"
                  loading={i > 4 ? "lazy" : "eager"}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-serif text-2xl mb-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{formatPrice(product.price)}</p>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-xs font-semibold border-b border-foreground pb-1">
                  View Details
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-24">
          <p className="font-serif text-2xl text-muted-foreground">No pieces found in this collection.</p>
          <button 
            onClick={() => setFilter('all')}
            className="mt-6 uppercase tracking-widest text-xs font-semibold border-b border-foreground pb-1"
          >
            View All Pieces
          </button>
        </div>
      )}
    </div>
  );
}
