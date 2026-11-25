import React from 'react';
import { Link } from 'wouter';

export const articles = [
  {
    slug: 'anatomy-of-brilliance',
    title: 'The Anatomy of Brilliance',
    subtitle: 'Understanding the silent language of light.',
    category: 'Craftsmanship',
    image: '/img/we-make1.jpg',
    excerpt: 'What makes a diamond truly captivating isn’t just its size, but how it interacts with the light around it. We explore the architectural precision behind our most radiant cuts.'
  },
  {
    slug: 'heirloom-care',
    title: 'Preserving Eternity',
    subtitle: 'A guide to caring for your fine jewelry.',
    category: 'Guide',
    image: '/img/woman2.jpg',
    excerpt: 'Diamonds are forever, but their settings require a gentle touch. Learn the daily habits and professional care routines that keep your heirloom pieces pristine.'
  },
  {
    slug: 'the-art-of-gifting',
    title: 'The Art of the Unspoken Promise',
    subtitle: 'Marking milestones with intentional design.',
    category: 'Editorial',
    image: '/img/fasion2.jpg',
    excerpt: 'Some moments defy words. We examine the history of gifting fine jewelry and how to select a piece that conveys the exact depth of your sentiment.'
  },
  {
    slug: 'atelier-secrets',
    title: 'Behind Closed Doors',
    subtitle: 'Inside the SHINE Atelier.',
    category: 'Heritage',
    image: '/img/we-make2.jpg',
    excerpt: 'From the initial sketch to the final polish, discover the meticulous, hundreds-of-hours journey a single piece of High Jewelry undertakes.'
  },
  {
    slug: 'modern-styling',
    title: 'Redefining the Parure',
    subtitle: 'How to wear High Jewelry today.',
    category: 'Style',
    image: '/img/fasion3.jpg',
    excerpt: 'Gone are the days when significant diamonds were locked in safes waiting for galas. We look at styling exceptional pieces with effortless, everyday confidence.'
  }
];

export default function Journal() {
  return (
    <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-24">
        <span className="uppercase tracking-[0.3em] text-secondary text-xs mb-4 block font-semibold">The Journal</span>
        <h1 className="font-serif text-5xl md:text-7xl mb-6">Editorial & Insights</h1>
        <p className="text-muted-foreground max-w-xl mx-auto font-serif text-lg">
          Stories of craftsmanship, heritage, and the artistry of living brilliantly.
        </p>
      </div>

      {/* Featured Article */}
      <div className="mb-24 group">
        <Link href={`/journal/${articles[0].slug}`} className="block">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={articles[0].image} 
                alt={articles[0].title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            <div className="md:pl-12 py-8">
              <span className="text-xs uppercase tracking-widest text-primary mb-4 block">{articles[0].category}</span>
              <h2 className="font-serif text-4xl md:text-5xl mb-4 leading-tight group-hover:text-primary transition-colors">{articles[0].title}</h2>
              <h3 className="font-serif text-xl text-muted-foreground mb-6">{articles[0].subtitle}</h3>
              <p className="text-sm leading-relaxed mb-8">{articles[0].excerpt}</p>
              <span className="uppercase tracking-widest text-xs font-semibold border-b border-foreground pb-1">
                Read Full Story
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
        {articles.slice(1).map((article) => (
          <Link key={article.slug} href={`/journal/${article.slug}`} className="group block">
            <div className="aspect-square overflow-hidden mb-6">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </div>
            <span className="text-xs uppercase tracking-widest text-primary mb-3 block">{article.category}</span>
            <h2 className="font-serif text-3xl mb-2 group-hover:text-primary transition-colors">{article.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">{article.excerpt}</p>
            <span className="uppercase tracking-widest text-xs font-semibold border-b border-foreground pb-1">
              Read Story
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
