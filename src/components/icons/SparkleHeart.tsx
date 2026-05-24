import React from 'react';

interface SparkleHeartProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean;
}

export function SparkleHeart({ filled, className = '', ...props }: SparkleHeartProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill={filled ? "currentColor" : "none"} 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      {filled ? (
        <path 
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
          stroke="none" 
        />
      ) : (
        <>
          {/* Top-left sparkle */}
          <path d="M5 2 L5.5 4 L7.5 4.5 L5.5 5 L5 7 L4.5 5 L2.5 4.5 L4.5 4 Z" fill="currentColor" stroke="none" />
          
          {/* Bottom-right sparkle */}
          <path d="M19 16 L19.5 17.5 L21 18 L19.5 18.5 L19 20 L18.5 18.5 L17 18 L18.5 17.5 Z" fill="currentColor" stroke="none" />
          
          <circle cx="16.5" cy="20.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="21" cy="14" r="0.7" fill="currentColor" stroke="none" />

          {/* Left half of heart */}
          <path d="M12 21.23 L4.22 13.45 A5.5 5.5 0 0 1 12 5.67" fill="none" />
          
          {/* Right half with gap */}
          <path d="M12 5.67 A5.5 5.5 0 0 1 20.84 13.45 L18.19 15.78" fill="none" />
          <path d="M16.42 17.34 L12 21.23" fill="none" />

          {/* Inner highlight */}
          <path d="M14.5 7.5 A3.5 3.5 0 0 1 18.5 10" fill="none" />
        </>
      )}
    </svg>
  );
}
