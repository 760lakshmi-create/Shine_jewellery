import React from 'react';
import { products, formatPrice } from '@/data/products';
import { Link } from 'wouter';
import { ArrowRight, Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

export default function HighJewelry() {
  const highJewelryProducts = products.filter(p => p.category === 'high-jewelry');
  const { toggleWishlist, isInWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-foreground text-background">
      {/* Hero */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/img/large-prd1.jpg" alt="High Jewelry" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <span className="uppercase tracking-[0.4em] text-secondary text-xs mb-8 block font-semibold animate-in fade-in slide-in-from-bottom-4 duration-1000">
            The Masterpieces
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            High Jewelry
          </h1>
          <p className="font-serif text-xl md:text-2xl text-background/80 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            A private exhibition of our most extraordinary creations.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 px-4 md:px-12 max-w-[100rem] mx-auto">
        <div className="space-y-32">
          {highJewelryProducts.map((product, index) => (
            <div key={product.id} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 lg:gap-24`}>
              
              <div className="flex-1 w-full relative group overflow-hidden">
                <div className="absolute top-6 right-6 z-10">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product.id);
                    }}
                    className="p-3 bg-background/10 backdrop-blur-md rounded-full hover:bg-background/20 transition-colors"
                  >
                    <Heart className={cn("w-5 h-5 transition-colors", isInWishlist(product.id) ? "fill-secondary text-secondary" : "text-background")} />
                  </button>
                </div>
                <Link href={`/product/${product.id}`}>
                  <div className="aspect-[3/4] md:aspect-[4/5] relative">
                    <img 
                      src={product.largeImage || product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>
                </Link>
              </div>

              <div className="flex-1 w-full">
                <div className="max-w-lg mx-auto">
                  <span className="text-secondary text-xs uppercase tracking-[0.3em] font-semibold mb-6 block">
                    No. {String(index + 1).padStart(3, '0')}
                  </span>
                  <h2 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">{product.name}</h2>
                  <p className="font-serif text-lg text-background/70 mb-10 leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="space-y-4 mb-12 border-l border-background/20 pl-6 py-2">
                    {product.details?.map((detail, i) => (
                      <div key={i} className="text-sm uppercase tracking-widest text-background/60">
                        {detail}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl">{formatPrice(product.price)}</span>
                    <Link href={`/product/${product.id}`} className="group flex items-center gap-4 uppercase tracking-[0.2em] text-xs border-b border-background/30 pb-2 hover:border-background hover:text-secondary transition-all">
                      Discover
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Appointment CTA */}
      <section className="py-32 border-t border-background/10 text-center px-4">
        <h2 className="font-serif text-4xl md:text-5xl mb-6">Private Viewings</h2>
        <p className="text-background/70 max-w-xl mx-auto mb-10 font-serif text-lg">
          High jewelry pieces are available for private viewing at our flagship boutiques. Request an appointment to experience their brilliance in person.
        </p>
        <Link href="/contact" className="inline-block bg-background text-foreground px-12 py-5 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-background/90 transition-colors">
          Book an Appointment
        </Link>
      </section>
    </div>
  );
}
