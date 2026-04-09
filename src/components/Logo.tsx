import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1DB954" />
          <stop offset="100%" stopColor="#00C2A8" />
        </linearGradient>
        <linearGradient id="logoGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00C2A8" />
          <stop offset="100%" stopColor="#1DB954" />
        </linearGradient>
      </defs>
      
      {/* Outer geometric network */}
      <path d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z" stroke="url(#logoGrad1)" strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="50" r="45" stroke="url(#logoGrad2)" strokeWidth="1" opacity="0.4" fill="none" />
      <circle cx="50" cy="50" r="35" stroke="url(#logoGrad1)" strokeWidth="0.5" opacity="0.3" fill="none" strokeDasharray="2 2" />
      
      {/* Network Nodes */}
      {[
        [50, 5], [89, 27.5], [89, 72.5], [50, 95], [11, 72.5], [11, 27.5],
        [50, 15], [80, 32.5], [80, 67.5], [50, 85], [20, 67.5], [20, 32.5]
      ].map(([x, y], i) => (
        <circle key={`node-${i}`} cx={x} cy={y} r="2" fill="#1DB954" />
      ))}

      {/* Aperture Blades */}
      <g transform="translate(50, 50)">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <path 
            key={`blade-${i}`}
            d="M 12 -22 L 32 -8 L 15 12 Z" 
            fill={i % 2 === 0 ? "url(#logoGrad1)" : "url(#logoGrad2)"} 
            opacity="0.85"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>

      {/* Center Eye / Lens */}
      <circle cx="50" cy="50" r="14" fill="#005c4f" />
      <circle cx="50" cy="50" r="10" fill="url(#logoGrad1)" />
      <circle cx="50" cy="50" r="4" fill="#005c4f" />
      <circle cx="52" cy="48" r="2" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}
