'use client'

import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { cn } from '../lib/utils';
import { useUser } from './UserContext'; // Import the new hook

// You can manage your navigation links in a structured way like this
const navLinks = [
  { href: "/", label: "Home" },
  { 
    label: "Practitioner Dashboard", 
    subLinks: [
      { href: "/Practitioner-Dashboard/", label: "Dashboard" },
      { href: "/Practitioner-Dashboard/Practitioner-Requests/", label: "Practitioner Requests" },
      { href: "/Practitioner-Dashboard/Practitioner-Offers/", label: "Practitioner Offers" },
      { href: "/Practitioner-Dashboard/Practitioner-Cases/", label: "Practitioner Cases" },
      { href: "/Practitioner-Dashboard/Practitioner-Financial/", label: "Practitioner Financial" },
      { href: "/Practitioner-Dashboard/Practitioner-Settings/", label: "Practitioner Settings" },
    ]
  },
];

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
    {children}
  </a>
);

const NavDropdown = ({ label, subLinks }: { label: string; subLinks: { href: string; label: string }[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 focus-visible:ring-offset-0 focus-visible:ring-0">
        {label}
        <ChevronDown className="w-4 h-4 ml-1" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="bg-[#011d41] border-gray-700 text-white">
      {subLinks.map(link => (
        <DropdownMenuItem key={link.href} asChild>
          <a href={link.href} className="cursor-pointer">{link.label}</a>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser(); // Get user data from the context

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Profile';

  return (
    <nav className="bg-[#011d41] text-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <img src="/bv-logo-textless-color.png" alt="BestVisa" className="h-8 w-auto" />
              <h1 className="text-lg font-bold">BestVisa Portal</h1>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <a href="https://www.bestvisa.ca" target="_blank" className="text-sm font-bold text-white hover:text-gray-300 px-3 py-2">
              BestVisa.ca
            </a>
            <div className="w-px h-6 bg-gray-600" />
            {navLinks.map(link => (
              link.subLinks 
                ? <NavDropdown key={link.label} label={link.label} subLinks={link.subLinks} />
                : <NavLink key={link.label} href={link.href}>{link.label}</NavLink>
            ))}
            <div className="w-px h-6 bg-gray-600" />
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:bg-white/10 hover:text-white">
                  {userName}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#011d41] border-gray-700 text-white">
                <DropdownMenuItem asChild><a href="/profile/">Profile</a></DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700"/>
                <DropdownMenuItem asChild><a href="/Account/Login/LogOff">Log off</a></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn("md:hidden", isMobileMenuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              link.subLinks 
                ? (
                    <div key={link.label}>
                        <h3 className="text-gray-400 px-3 py-2">{link.label}</h3>
                        {link.subLinks.map(sub => <a key={sub.label} href={sub.href} className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">{sub.label}</a>)}
                    </div>
                )
                : <a key={link.label} href={link.href} className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">{link.label}</a>
            ))}
            <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-gray-400 px-3 py-2">{userName}</h3>
                <a href="/profile/" className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">Profile</a>
                <a href="/Account/Login/LogOff" className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">Log off</a>
            </div>
        </div>
      </div>
    </nav>
  );
}