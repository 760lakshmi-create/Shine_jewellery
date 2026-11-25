import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export function Logo({ className, variant = 'horizontal' }: LogoProps) {
  const mark = (
    <svg 
      viewBox="0 0 28 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={cn("shrink-0", variant === 'horizontal' ? 'w-6 h-5 md:w-7 md:h-6' : 'w-8 h-7')}
    >
      <path d="M8 2L20 2L26 8L14 22L2 8Z" />
      <path d="M2 8L26 8" />
      <path d="M8 2L14 8L20 2" />
      <path d="M10 8L14 22L18 8" />
      <path d="M8 2L10 8" />
      <path d="M20 2L18 8" />
    </svg>
  );

  const text = (
    <span 
      className={cn(
        "font-serif uppercase leading-none font-medium",
        variant === 'horizontal' ? 'text-xl md:text-2xl mt-1' : 'text-xl mt-1'
      )}
      style={{ letterSpacing: '0.35em', marginRight: '-0.35em' }}
    >
      SHINE
    </span>
  );

  return (
    <div 
      className={cn(
        "flex text-current items-center", 
        variant === 'horizontal' ? 'flex-row gap-3' : 'flex-col justify-center gap-2',
        className
      )}
    >
      {mark}
      {text}
    </div>
  );
}
