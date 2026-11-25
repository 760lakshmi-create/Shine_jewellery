import React, { useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { articles } from '@/pages/Journal';
import { ArrowLeft } from 'lucide-react';

export default function JournalArticle() {
  const [, params] = useRoute('/journal/:slug');
  const article = articles.find(a => a.slug === params?.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.slug]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-serif text-4xl mb-4">Article Not Found</h1>
        <Link href="/journal" className="border-b border-foreground uppercase tracking-widest text-xs">
          Return to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        
        <Link href="/journal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-widest text-xs">Back to Journal</span>
        </Link>

        <div className="text-center mb-16">
          <span className="uppercase tracking-[0.2em] text-primary text-xs mb-6 block font-semibold">
            {article.category}
          </span>
          <h1 className="font-serif text-5xl md:text-6xl mb-6 leading-tight">{article.title}</h1>
          <p className="font-serif text-2xl text-muted-foreground italic">
            {article.subtitle}
          </p>
        </div>

        <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden mb-16 relative">
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-2xl mx-auto prose prose-lg md:prose-xl prose-p:font-serif prose-p:leading-loose prose-p:text-foreground/80">
          <p className="first-letter:text-7xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:text-primary">
            There is a profound silence that surrounds a truly exceptional piece of jewelry. Before a word is spoken, before the weight of the metal is even felt against the skin, the light speaks. It is a language older than humanity itself, translated through the hands of master artisans who understand that their true medium is not gold or diamond, but radiance itself.
          </p>
          <p>
            When we speak of creation within the SHINE atelier, we do not speak merely of assembly. Every curve of the setting, every meticulously placed prong, is designed to serve a singular purpose: to step out of the way. The architecture of a high jewelry piece must be structurally uncompromising yet visually ethereal, allowing the diamond to capture, bend, and return light with maximum theatricality.
          </p>
          <p>
            It is a delicate balance of tension and release. Our craftsmen spend hundreds of hours studying the unique geometry of each stone. No two diamonds shatter light in precisely the same manner; therefore, no two settings can be identical. We forge the gold around the stone's inherent personality, ensuring that when it is finally worn, it does not sit static, but dances with the wearer's every breath.
          </p>
          <p>
            Ultimately, what leaves our boutique is more than an adornment. It is a captured star, engineered to hold a memory, a promise, or a milestone in perpetual brilliance. It requires no explanation—only a moment of quiet awe.
          </p>
        </div>

        <div className="mt-24 pt-12 border-t border-border text-center">
          <Link href="/journal" className="uppercase tracking-widest text-xs font-semibold hover:text-primary transition-colors">
            Discover More Stories
          </Link>
        </div>

      </div>
    </div>
  );
}
