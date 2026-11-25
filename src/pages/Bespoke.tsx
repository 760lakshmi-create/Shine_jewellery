import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Bespoke() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="pt-24 min-h-screen bg-background">
      
      {/* Hero */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/img/we-make1.jpg" alt="Bespoke Craftsmanship" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-3xl">
          <span className="uppercase tracking-[0.3em] text-white/80 text-xs mb-6 block font-semibold">Special Commissions</span>
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Bespoke Creations</h1>
          <p className="font-serif text-xl text-white/90">
            Translate your imagination into eternal brilliance.
          </p>
        </div>
      </section>

      {/* Content & Form */}
      <section className="py-24 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          <div>
            <h2 className="font-serif text-4xl mb-6">The Journey to Unique</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              A bespoke SHINE commission is the ultimate expression of personal narrative. Working directly with our master designers, you will embark on a creative journey from initial sketch to final polish.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-12">
              Whether sourcing a remarkably rare stone or architecting a setting that defies convention, our ateliers exist to make the impossible, tangible. Commissions typically require 8 to 12 weeks of meticulous craftsmanship.
            </p>

            <div className="space-y-8 pl-6 border-l border-primary/20">
              <div>
                <span className="text-xs uppercase tracking-widest text-primary font-semibold mb-2 block">Phase I: Discovery</span>
                <p className="text-sm text-muted-foreground">A private consultation to understand your vision, aesthetic preferences, and the story the piece will tell.</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-primary font-semibold mb-2 block">Phase II: Design & Sourcing</span>
                <p className="text-sm text-muted-foreground">Presentation of hand-drawn gouache sketches alongside curated selections of loose diamonds for your approval.</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-primary font-semibold mb-2 block">Phase III: The Atelier</span>
                <p className="text-sm text-muted-foreground">Our master jewelers forge the metal and set the stones, bringing the sketch to brilliant, three-dimensional life.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-muted p-8 md:p-12 relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <h3 className="font-serif text-3xl mb-8 relative z-10">Initiate a Commission</h3>
            
            {isSuccess ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center animate-in fade-in duration-500 relative z-10">
                <h4 className="font-serif text-2xl mb-4 text-primary">Inquiry Submitted</h4>
                <p className="text-muted-foreground">
                  Your vision has been shared with our design team. A senior bespoke consultant will reach out within 48 hours to schedule your private discovery session.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setIsSuccess(false)}
                  className="mt-8 rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground font-sans tracking-[0.2em] uppercase text-xs"
                >
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
                  <input required type="text" className="w-full bg-background border border-border p-4 outline-none focus:border-primary text-sm" />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
                  <input required type="email" className="w-full bg-background border border-border p-4 outline-none focus:border-primary text-sm" />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Budget Range (INR)</label>
                  <select className="w-full bg-background border border-border p-4 outline-none focus:border-primary text-sm appearance-none">
                    <option>₹5,00,000 - ₹10,00,000</option>
                    <option>₹10,00,000 - ₹25,00,000</option>
                    <option>₹25,00,000 - ₹50,00,000</option>
                    <option>₹50,00,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">The Vision</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe the piece you envision, occasion, or any specific stones you desire..."
                    className="w-full bg-background border border-border p-4 outline-none focus:border-primary text-sm resize-none"
                  ></textarea>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-xs transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
