import React from 'react';
import { Link } from 'wouter';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-20 px-4 md:px-12 mt-20">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-background/20 pb-16">
        <div className="md:col-span-1">
          <div className="mb-8">
            <Logo variant="horizontal" className="text-background" />
          </div>
          <p className="text-sm text-background/70 font-serif leading-relaxed mt-4">
            Crafting eternal moments in gold and diamond. A legacy of brilliance passed down through generations.
          </p>
        </div>
        
        <div>
          <h4 className="uppercase tracking-widest text-xs font-semibold mb-6 text-secondary">The Maison</h4>
          <ul className="space-y-4 text-sm text-background/70">
            <li><Link href="/about" className="hover:text-background transition-colors">Our Heritage</Link></li>
            <li><Link href="/high-jewelry" className="hover:text-background transition-colors">High Jewelry</Link></li>
            <li><Link href="/journal" className="hover:text-background transition-colors">The Journal</Link></li>
            <li><Link href="/bespoke" className="hover:text-background transition-colors">Bespoke Commissions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="uppercase tracking-widest text-xs font-semibold mb-6 text-secondary">Client Services</h4>
          <ul className="space-y-4 text-sm text-background/70">
            <li><Link href="/contact" className="hover:text-background transition-colors">Contact Boutiques</Link></li>
            <li><Link href="/gifting" className="hover:text-background transition-colors">Gift Guide</Link></li>
            <li><Link href="/diamond-guide" className="hover:text-background transition-colors">Diamond Guide</Link></li>
            <li><Link href="/wishlist" className="hover:text-background transition-colors">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="uppercase tracking-widest text-xs font-semibold mb-6 text-secondary">Stay Connected</h4>
          <p className="text-sm text-background/70 mb-4">
            Subscribe to our newsletter for exclusive collections and intimate events.
          </p>
          <div className="flex border-b border-background/30 pb-2">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-background/40"
            />
            <button className="uppercase tracking-widest text-xs hover:text-primary transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-background/50">
        <p>&copy; {new Date().getFullYear()} SHINE Fine Jewelry. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="#" className="hover:text-background transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-background transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
