import React, { ReactNode } from 'react';

interface RippleEffectProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RippleEffect({ children, className = '', size = 'md' }: RippleEffectProps) {
  const sizes = {
    sm: { ripple: 'w-32 h-32', inner: 'w-24 h-24' },
    md: { ripple: 'w-40 h-40', inner: 'w-32 h-32' },
    lg: { ripple: 'w-48 h-48', inner: 'w-40 h-40' },
  };

  const { ripple, inner } = sizes[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ripple effects */}
      <div className={`absolute ${ripple} rounded-full animate-ping bg-primary opacity-5`}></div>
      <div className={`absolute ${ripple} rounded-full animate-pulse bg-secondary opacity-5`} style={{ animationDelay: '0.5s' }}></div>
      <div className={`absolute ${inner} rounded-full animate-pulse bg-success opacity-10`} style={{ animationDelay: '1s' }}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}