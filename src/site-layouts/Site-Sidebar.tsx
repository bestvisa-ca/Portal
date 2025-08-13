'use client';

import React, { useEffect, useState } from 'react';
import { Home, List, FileText, Briefcase, DollarSign, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export type SidebarVariant = 'applicant' | 'practitioner';
type NavLink = { href: string; label: string; icon: React.ElementType };

const BRAND = { light:'#efefef', primary:'#a4262c', navy:'#011d41', white:'#ffffff' };

const PRACTITIONER_LINKS: NavLink[] = [
  { href: '/Practitioner-Dashboard/', label: 'Dashboard', icon: Home },
  { href: '/Practitioner-Dashboard/Practitioner-Requests/', label: 'Requests', icon: List },
  { href: '/Practitioner-Dashboard/Practitioner-Offers/', label: 'Offers & Contracts', icon: FileText },
  { href: '/Practitioner-Dashboard/Practitioner-Cases/', label: 'Active Cases', icon: Briefcase },
  { href: '/Practitioner-Dashboard/Practitioner-Financial/', label: 'Financial', icon: DollarSign },
  { href: '/Practitioner-Dashboard/Practitioner-Settings/', label: 'Settings', icon: Settings },
];

const APPLICANT_LINKS: NavLink[] = [
  { href: '/Applicant-Dashboard/', label: 'Dashboard', icon: Home },
  { href: '/Applicant-Dashboard/Requests/', label: 'Requests', icon: List },
  { href: '/Applicant-Dashboard/Offers/', label: 'Offers & Contracts', icon: FileText },
  { href: '/Applicant-Dashboard/Cases/', label: 'My Cases', icon: Briefcase },
  { href: '/Applicant-Dashboard/applicant-financial/', label: 'Financial', icon: DollarSign },
  { href: '/Applicant-Dashboard/applicant-settings/', label: 'Settings', icon: Settings },
];

export default function SiteSidebar({
  variant = 'applicant',
  className,
  title,
  links,
}: {
  variant?: SidebarVariant;
  className?: string;
  title?: string;
  links?: NavLink[]; // optional override
}) {
  const [active, setActive] = useState('');

  useEffect(() => {
    setActive(window.location.pathname);
  }, []);

  const resolved = links ?? (variant === 'practitioner' ? PRACTITIONER_LINKS : APPLICANT_LINKS);
  const headerTitle = title ?? (variant === 'practitioner' ? 'Practitioner Panel' : 'Applicant Panel');

  return (
    <aside
      className={cn(
        // match practitioner container bg
        'hidden md:flex flex-col w-64 p-4 flex-shrink-0',
        className
      )}
      style={{ backgroundColor: BRAND.light }} // #efefef
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold" style={{ color: BRAND.navy }}>{headerTitle}</h2>
        <hr className="border-t" style={{ borderColor: 'rgba(1,29,65,0.3)' }} />
      </div>

      <nav>
        <ul className="space-y-2">
          {resolved.map((link) => {
            const isActive = active.startsWith(link.href);
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors',
                    // exact practitioner behavior:
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-white'
                  )}
                  style={{
                    backgroundColor: isActive ? BRAND.primary : BRAND.navy, // active = red, inactive = navy
                  }}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
