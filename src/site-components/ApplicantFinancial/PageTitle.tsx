'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PageTitle({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left: Title + Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-[#011d41]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
        )}

        {/* Minimal badge on mobile */}
        {badge && (
          <div className="mt-2 inline-flex items-center gap-1 rounded border border-[#011d41] px-2 py-0.5 text-xs font-medium text-[#011d41] md:hidden">
            <ShieldCheck className="h-3 w-3" />
            {badge}
          </div>
        )}
      </div>

      {/* Full pill badge on desktop */}
      {badge && (
        <div className="hidden md:inline-flex items-center gap-2 rounded-full bg-[#011d41] px-3 py-1 text-white ring-1 ring-black/10">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wide">{badge}</span>
        </div>
      )}
    </div>
  );
}
