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
      {/* Background Circle - optional, can remove if not desired */}
      {/* <circle cx="50" cy="50" r="48" fill="hsl(var(--primary) / 0.1)" /> */}

      {/* Book Shape - Open Book */}
      <path
        d="M25 80C25 75 30 70 35 70H65C70 70 75 75 75 80V20H25V80Z"
        fill="hsl(var(--primary))" // Irish Green for book
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3"
      />
      {/* Spine */}
      <path
        d="M50 20V80"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Pages detail - left */}
      <path
        d="M30 25H48 M30 30H48 M30 35H48 M30 40H48 M30 45H48 M30 50H48 M30 55H48 M30 60H48 M30 65H48"
        stroke="hsl(var(--primary-foreground) / 0.5)"
        strokeWidth="1.5"
      />
      {/* Pages detail - right */}
       <path
        d="M52 25H70 M52 30H70 M52 35H70 M52 40H70 M52 45H70 M52 50H70 M52 55H70 M52 60H70 M52 65H70"
        stroke="hsl(var(--primary-foreground) / 0.5)"
        strokeWidth="1.5"
      />

      {/* River Shannon element - flowing across the book */}
      <path
        d="M 30 45 Q 50 38, 70 45 L 70 53 Q 50 62, 30 53 L 30 45 Z"
        fill="hsl(var(--accent))" // Irish Orange for river
        stroke="hsl(var(--accent-foreground))" // White/Light stroke for river outline
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* Optional subtle wave highlights on the river */}
      <path
        d="M35 48 Q 45 45, 50 48 T 65 48"
        stroke="hsl(var(--accent-foreground) / 0.6)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
       <path
        d="M38 50 Q 48 47, 53 50 T 68 50"
        stroke="hsl(var(--accent-foreground) / 0.5)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />

    </svg>
  );
}

