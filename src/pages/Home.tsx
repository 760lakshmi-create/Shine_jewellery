import React from 'react';
import { products, formatPrice } from '@/data/products';
import { Link } from 'wouter';
import { ArrowRight, Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

export default function Home() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const featuredProducts = products.slice(0, 4);

  return (
    <main className="w-full min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[100dvh] w-full overflow-hidden bg-foreground">
        <div className="absolute inset-0 z-0">
          <img
            src="/img/header.jpg"
            alt=""
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />
          <img
            src="/video/mav.mp4.gif"
            alt=""
            className="absolute inset-0 z-10 w-full h-full object-cover opacity-90"
          />
          {/* Light readability gradient -- video stays bright and visible, only edges are tinted */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>
          {/* Soft focal scrim behind the headline only, so text stays legible without darkening the whole video */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 48%, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0) 80%)",
            }}
          ></div>
          {/* Corner mask: conceals the stock footage watermark in the top-right of the source video */}
          <div
            className="absolute -top-6 -right-6 w-48 h-48 md:w-56 md:h-56 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 75%)",
            }}
          ></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-20">
          <span
            className="uppercase tracking-[0.3em] text-white/90 text-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
          >
            The New Collection
          </span>
          <h1
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300"
            style={{ textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
          >
            Eternal<br className="md:hidden"/> Brilliance
          </h1>
          <p
            className="font-serif text-lg md:text-xl text-white max-w-lg mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
          >
            Crafting milestones into masterpieces. Discover jewelry designed for the moments that define a lifetime.
          </p>
          <Link
            href="/collections"
            className="group flex items-center gap-4 text-white uppercase tracking-[0.2em] text-sm border-b border-white/40 pb-2 hover:border-white transition-all animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            Explore the Collection
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Featured Collection Grid */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Curated Signatures</h2>
            <p className="text-muted-foreground max-w-md">Our most iconic pieces, embodying the perfect harmony of rare stones and masterful artistry.</p>
          </div>
          <Link href="/collections" className="uppercase tracking-widest text-xs font-semibold hover:text-primary transition-colors pb-1 border-b border-foreground">
            View All Pieces
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featuredProducts.map((product) => (
            <div key={product.id} className="group relative cursor-pointer">
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
              <Link href={`/product/${product.id}`} className="block">
                <div className="relative aspect-[4/5] bg-muted mb-6 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl mb-1">{product.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">High Jewelry</p>
                  </div>
                  <span className="text-sm">{formatPrice(product.price)}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-square md:aspect-[3/4] overflow-hidden">
            <img src="/img/we-make1.jpg" alt="Jewelry Craftsmanship" className="w-full h-full object-cover" />
          </div>
          <div className="order-1 md:order-2 md:pl-12">
            <span className="uppercase tracking-[0.2em] text-sm text-secondary mb-6 block">Savoir-Faire</span>
            <h2 className="font-serif text-4xl md:text-5xl mb-8 leading-tight">Born in Fire,<br/>Perfected by Hand</h2>
            <p className="text-primary-foreground/80 mb-8 font-serif text-lg leading-relaxed">
              Behind every SHINE creation is a lineage of master craftsmen. We source only the top 1% of the world's diamonds, shaping them in our ateliers to maximize their innate fire and brilliance. 
              <br/><br/>
              A dedication to perfection that takes hundreds of hours, invisible to the eye but undeniable to the heart.
            </p>
            <Link href="/about" className="inline-flex items-center gap-4 uppercase tracking-[0.2em] text-sm border-b border-primary-foreground/30 pb-2 hover:border-primary-foreground transition-all">
              Discover Our Craft
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* High-Impact Visual Moment */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/img/fasion1.jpg" alt="Model wearing Shine Jewelry" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h2 className="font-serif text-5xl md:text-7xl mb-6 shadow-sm">The Wedding Edit</h2>
          <Link href="/collections" className="bg-white text-black px-8 py-4 uppercase tracking-widest text-xs font-semibold hover:bg-white/90 transition-colors">
            Shop Bridal
          </Link>
        </div>
      </section>
    </main>
  );
}
