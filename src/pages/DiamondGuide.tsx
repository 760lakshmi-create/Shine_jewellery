import React from 'react';
import { Link } from 'wouter';

export default function DiamondGuide() {
  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto min-h-screen">
      <div className="text-center mb-24">
        <span className="uppercase tracking-[0.3em] text-secondary text-xs mb-4 block font-semibold">Education</span>
        <h1 className="font-serif text-5xl md:text-7xl mb-6">The Diamond Guide</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto font-serif text-lg">
          We believe an informed choice is a confident one. Discover the stringent criteria that elevate a stone from beautiful to legendary.
        </p>
      </div>

      {/* The 4 Cs */}
      <div className="space-y-32 mb-32">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
            <span className="font-serif text-[15rem] text-background/50 absolute select-none">C</span>
            <div className="relative z-10 w-2/3 h-2/3 border border-foreground/10 p-8 flex flex-col justify-center items-center text-center backdrop-blur-sm bg-background/30">
              <h3 className="font-serif text-3xl mb-2">Cut</h3>
              <p className="uppercase tracking-widest text-xs text-primary font-semibold">The Architecture of Light</p>
            </div>
          </div>
          <div className="order-1 md:order-2 md:pl-12">
            <h2 className="font-serif text-4xl mb-6">01. The Cut</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Often mistaken for the shape (round, oval, emerald), the cut actually refers to how well a diamond's facets interact with light. It is the only "C" entirely dictated by human hands.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              At SHINE, we accept only Excellent and Ideal cuts. A masterfully cut diamond acts as an optical prism—gathering light from above, bouncing it internally, and returning it in a spectacular display of fire and brilliance.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="md:pr-12">
            <h2 className="font-serif text-4xl mb-6">02. The Color</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              In diamonds, color actually refers to the <em>absence</em> of color. The scale begins at D (colorless) and continues down the alphabet, with each step indicating a subtle increase in yellow or brown tones.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We operate exclusively within the D to H range—from entirely colorless to near-colorless stones that appear completely icy white to the naked eye.
            </p>
          </div>
          <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
            <span className="font-serif text-[15rem] text-background/50 absolute select-none">C</span>
            <div className="relative z-10 w-2/3 h-2/3 border border-foreground/10 p-8 flex flex-col justify-center items-center text-center backdrop-blur-sm bg-background/30">
              <h3 className="font-serif text-3xl mb-2">Color</h3>
              <p className="uppercase tracking-widest text-xs text-primary font-semibold">The Icy Purity</p>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
            <span className="font-serif text-[15rem] text-background/50 absolute select-none">C</span>
            <div className="relative z-10 w-2/3 h-2/3 border border-foreground/10 p-8 flex flex-col justify-center items-center text-center backdrop-blur-sm bg-background/30">
              <h3 className="font-serif text-3xl mb-2">Clarity</h3>
              <p className="uppercase tracking-widest text-xs text-primary font-semibold">The Crystal Depths</p>
            </div>
          </div>
          <div className="order-1 md:order-2 md:pl-12">
            <h2 className="font-serif text-4xl mb-6">03. The Clarity</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Born deep within the earth under extreme heat and pressure, nearly all diamonds bear natural birthmarks. Internal marks are "inclusions," while external ones are "blemishes."
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our standard ensures that every stone is "eye-clean." We source predominantly VVS (Very, Very Slightly Included) and VS (Very Slightly Included) stones, ensuring absolute visual purity.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="md:pr-12">
            <h2 className="font-serif text-4xl mb-6">04. The Carat</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Carat simply measures the physical weight of the diamond, not its size. Two diamonds of equal carat weight can appear entirely different in size depending on their cut and proportions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              While a larger carat weight is rare and valuable, we believe it should never come at the expense of a brilliant cut. A slightly smaller, masterfully cut diamond will always outshine a larger, poorly cut stone.
            </p>
          </div>
          <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
            <span className="font-serif text-[15rem] text-background/50 absolute select-none">C</span>
            <div className="relative z-10 w-2/3 h-2/3 border border-foreground/10 p-8 flex flex-col justify-center items-center text-center backdrop-blur-sm bg-background/30">
              <h3 className="font-serif text-3xl mb-2">Carat</h3>
              <p className="uppercase tracking-widest text-xs text-primary font-semibold">The Measure of Rarity</p>
            </div>
          </div>
        </section>
      </div>

      {/* Certification & Care */}
      <div className="grid md:grid-cols-2 gap-12 border-t border-border pt-24">
        <div>
          <h3 className="font-serif text-3xl mb-4">Certification</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Every SHINE diamond over 0.3 carats is accompanied by a grading report from the Gemological Institute of America (GIA). This independent certification is the global standard for diamond grading, ensuring absolute transparency and trust in your investment.
          </p>
        </div>
        <div>
          <h3 className="font-serif text-3xl mb-4">Daily Care</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Diamonds are the hardest natural substance on earth, but they can still chip upon hard impact. We recommend removing your jewelry during strenuous activities. To restore its fire, gently clean your diamond with a soft brush, warm water, and mild dish soap, then dry with a lint-free cloth.
          </p>
        </div>
      </div>

      <div className="mt-24 text-center">
        <Link href="/collections" className="inline-block bg-primary text-primary-foreground px-12 py-5 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary/90 transition-colors">
          Explore Our Diamonds
        </Link>
      </div>

    </div>
  );
}
