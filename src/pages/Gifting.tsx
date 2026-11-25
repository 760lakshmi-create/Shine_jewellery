import React from 'react';
import { products, formatPrice } from '@/data/products';
import { Link } from 'wouter';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

export default function Gifting() {
  const { toggleWishlist, isInWishlist } = useWishlist();

  const occasions = [
    {
      id: "anniversary",
      title: "Anniversary & Milestones",
      description: "Celebrate the passage of time with eternity bands and significant statement pieces.",
      image: "/img/fasion1.jpg",
      items: products.filter(p => ["12", "11", "3", "9"].includes(p.id))
    },
    {
      id: "engagement",
      title: "The Proposal",
      description: "Rings designed to secure a breathtaking 'Yes'.",
      image: "/img/woman3.jpg",
      items: products.filter(p => ["11", "16", "2"].includes(p.id))
    },
    {
      id: "everyday",
      title: "Everyday Elegance",
      description: "Subtle brilliance meant to be worn and cherished daily.",
      image: "/img/woman1.jpg",
      items: products.filter(p => ["4", "5", "10", "14"].includes(p.id))
    }
  ];

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-24">
          <span className="uppercase tracking-[0.3em] text-secondary text-xs mb-4 block font-semibold">Curated Collections</span>
          <h1 className="font-serif text-5xl md:text-7xl mb-6">The Gift Guide</h1>
          <p className="text-muted-foreground max-w-xl mx-auto font-serif text-lg">
            Find the perfect expression of your affection. Curated selections for life's most meaningful moments.
          </p>
        </div>

        {occasions.map((occasion, index) => (
          <div key={occasion.id} className="mb-32">
            {/* Occasion Hero */}
            <div className={`grid md:grid-cols-2 gap-12 items-center mb-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className={`aspect-[4/3] overflow-hidden ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                <img src={occasion.image} alt={occasion.title} className="w-full h-full object-cover" />
              </div>
              <div className={`md:px-12 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                <h2 className="font-serif text-4xl md:text-5xl mb-6">{occasion.title}</h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">{occasion.description}</p>
                <Link href="/collections" className="uppercase tracking-widest text-xs font-semibold border-b border-foreground pb-1">
                  View Full Collection
                </Link>
              </div>
            </div>

            {/* Occasion Products */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {occasion.items.map((product) => (
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
                    <div className="relative aspect-[4/5] bg-muted mb-4 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-1000 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <h3 className="font-serif text-lg mb-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
