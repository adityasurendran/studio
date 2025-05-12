// src/components/logo.tsx
import type { SVGProps } from 'react';

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Shannon Logo"
      {...props}
    >
      <defs>
        <clipPath id="shannonLogoScurveClip">
          {/* This path defines the area for the accent color (orange part) */}
          {/* It's the S-curve itself, then completed to cover the 'right' side of the curve within the circle */}
          <path d="M20 5 
                   C45 25, 25 45, 50 50 
                   C75 55, 55 75, 80 95 
                   L100 95 L100 5 Z" />
        </clipPath>
      </defs>

      {/* Base circle - This will be the primary color (green part) */}
      <circle cx="50" cy="50" r="45" fill="hsl(var(--primary))" />
      
      {/* Accent color part - This circle is drawn on top but clipped by the S-curve path */}
      <circle cx="50" cy="50" r="45" fill="hsl(var(--accent))" clip-path="url(#shannonLogoScurveClip)" />

      {/* The S-curve line itself, drawn on top of the two colored sections */}
      {/* This creates the visual separation and the 'S' shape */}
      <path d="M20 5 
               C45 25, 25 45, 50 50 
               C75 55, 55 75, 80 95"
            stroke="hsl(var(--primary-foreground))" 
            strokeWidth="5"  // Increased stroke width for better visibility
            fill="none" 
            strokeLinecap="round"
            strokeLinejoin="round"/>
    </svg>
  );
}
