import React from 'react';
import { Link } from 'wouter';

export default function About() {
  return (
    <div className="pt-24 min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/img/woman1.jpg" alt="Elegance" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="uppercase tracking-[0.3em] text-white/80 text-sm mb-6 block font-semibold">The Maison</span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl">A Legacy of Light</h1>
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-32 text-center">
        <h2 className="font-serif text-3xl md:text-5xl mb-12 leading-relaxed text-foreground">
          "Jewelry is not simply an accessory. It is a vessel for memory, a physical manifestation of an eternal promise."
        </h2>
        <p className="text-muted-foreground font-serif text-lg md:text-xl leading-loose mb-16">
          Founded on the principle that the most profound moments in life deserve to be immortalized in earth's rarest elements. 
          At SHINE, we do not follow seasons or trends. We craft heirlooms. 
          Every diamond is selected for its exceptional fire, and every setting is engineered to amplify its natural brilliance.
        </p>
      </section>

      {/* Dual Imagery Break */}
      <section className="max-w-[100rem] mx-auto px-4 md:px-12 py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="aspect-[3/4] overflow-hidden group">
            <img src="/img/we-make2.jpg" alt="Crafting process" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
          <div className="aspect-square overflow-hidden group md:-mt-32">
            <img src="/img/woman2.jpg" alt="Elegance" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          </div>
        </div>
      </section>

      {/* Ateliers */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-24 text-center">
        <span className="uppercase tracking-[0.3em] text-secondary text-xs mb-6 block font-semibold">The Ateliers</span>
        <h2 className="font-serif text-4xl md:text-6xl mb-8">Masters of the Craft</h2>
        <p className="text-muted-foreground font-serif text-lg leading-loose mb-12">
          Our ateliers marry centuries-old techniques with uncompromising modern precision. 
          The result is jewelry that feels alive—pieces that capture light in a way that words cannot fully describe, 
          but the heart instantly understands. Hundreds of hours are poured into a single high jewelry creation, ensuring the gold flows like fabric and the diamonds appear to float.
        </p>
      </section>

      {/* Grand Full-Bleed Break */}
      <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden mb-24">
        <div className="absolute inset-0">
          <img src="/img/image.png" alt="SHINE Signature Style" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4 self-end pb-24">
          <h2 className="font-serif text-4xl md:text-6xl mb-8">Ready to Discover?</h2>
          <Link href="/collections" className="inline-block bg-background text-foreground px-12 py-5 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-background/90 transition-colors">
            Explore Our Collections
          </Link>
        </div>
      </section>

    </div>
  );
}
