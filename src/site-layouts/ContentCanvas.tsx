// site-layouts/ContentCanvas.tsx
'use client';

import React from 'react';

export default function ContentCanvas({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Matches TestStripePaymentPage card feel: white, rounded, subtle ring + shadow
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8 ${className}`}>
      {children}
    </div>
  );
}
