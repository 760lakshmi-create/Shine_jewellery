import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ShoppingBag, Menu, X, Search, Heart, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDarkHero = ['/', '/about', '/high-jewelry', '/bespoke'].includes(location);
  const isLightText = !scrolled && !mobileMenuOpen && isDarkHero;

  return (
    <header 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border py-4" : "bg-transparent py-6",
        isLightText ? "text-white" : "text-foreground"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          
          {/* Mobile Menu Toggle */}
          <button 
            className="xl:hidden p-2 -ml-2 hover:opacity-70 transition-opacity"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Links (Left) */}
          <nav className="hidden xl:flex items-center gap-6 text-xs uppercase tracking-widest flex-1">
            <Link href="/collections" className="hover:text-primary transition-colors duration-300">
              Collections
            </Link>
            <Link href="/high-jewelry" className="hover:text-primary transition-colors duration-300">
              High Jewelry
            </Link>
            <Link href="/gifting" className="hover:text-primary transition-colors duration-300">
              Gifts
            </Link>
            <Link href="/bespoke" className="hover:text-primary transition-colors duration-300">
              Bespoke
            </Link>
          </nav>

          {/* Logo */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Logo variant="horizontal" />
            </Link>
          </div>

          {/* Desktop Links & Icons (Right) */}
          <div className="flex-1 flex items-center justify-end gap-4 md:gap-6">
            <div className="hidden xl:flex items-center gap-6 text-xs uppercase tracking-widest mr-4">
              <Link href="/journal" className="hover:text-primary transition-colors duration-300">
                Journal
              </Link>
              <Link href="/about" className="hover:text-primary transition-colors duration-300">
                Maison
              </Link>
            </div>

            <button className="hidden md:block hover:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/wishlist" className="hover:text-primary transition-colors relative block">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href={user ? '/profile' : '/login'} className="hover:text-primary transition-colors" aria-label={user ? 'View profile' : 'Sign in'}>
              <UserRound className="w-5 h-5" />
            </Link>
            <button 
              className="hover:text-primary transition-colors relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <div className="pl-2">
              <Logo variant="horizontal" />
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:opacity-70 transition-opacity">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col gap-8 p-8 text-2xl font-serif mt-4">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/collections" onClick={() => setMobileMenuOpen(false)}>Collections</Link>
            <Link href="/high-jewelry" onClick={() => setMobileMenuOpen(false)}>High Jewelry</Link>
            <Link href="/gifting" onClick={() => setMobileMenuOpen(false)}>Gifting</Link>
            <Link href="/bespoke" onClick={() => setMobileMenuOpen(false)}>Bespoke Commission</Link>
            <Link href="/journal" onClick={() => setMobileMenuOpen(false)}>The Journal</Link>
            <Link href="/diamond-guide" onClick={() => setMobileMenuOpen(false)}>Diamond Guide</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>The Maison</Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Boutiques</Link>
          </div>
        </div>
      )}
    </header>
  );
}
