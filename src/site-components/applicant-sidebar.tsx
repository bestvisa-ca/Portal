'use client'

import { useState, useEffect } from 'react';
import { Home, List, FileText, Briefcase, DollarSign, Settings } from 'lucide-react';
import { cn } from '../lib/utils'; // Standard utility from shadcn

// Define the structure for each navigation link
interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navLinks: NavLink[] = [
  { href: "/Applicant-Dashboard/", label: "Dashboard", icon: Home },
  { href: "/Applicant-Dashboard/Applicant-Requests/", label: "Requests", icon: List },
  { href: "/Applicant-Dashboard/Applicant-Offers/", label: "Offers & Contracts", icon: FileText },
  { href: "/Applicant-Dashboard/Applicant-Cases/", label: "Active Cases", icon: Briefcase },
  { href: "/Applicant-Dashboard/applicant-financial/", label: "Financial", icon: DollarSign },
  { href: "/Applicant-Dashboard/applicant-settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    // Set the active link based on the current window location
    setActiveLink(window.location.pathname);
  }, []);

  return (
    // Responsive sidebar: hidden on small screens (md breakpoint), flex column on larger screens
    <aside className="hidden md:flex flex-col w-64 bg-[#efefef] p-4 flex-shrink-0">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[#011d41]">Applicant Panel</h2>
        <hr className="border-t border-[#011d41]/30 mt-2" />
      </div>
      <nav>
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors",
                  // Conditional styling for the active link
                  activeLink.startsWith(link.href)
                    ? 'bg-[#a4262c] text-white shadow-sm' // Active state
                    : 'text-[#011d41] bg-[#011d41] text-white hover:bg-[#a4262c]/90' // Inactive state
                )}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}