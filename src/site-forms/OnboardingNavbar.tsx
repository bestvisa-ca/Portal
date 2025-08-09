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

// Define the type for navigation links
type NavSubLink = { href: string; label: string };
type NavLink = { href: string; label: string; subLinks?: NavSubLink[] };

// You can manage your navigation links in a structured way like this
const navLinks: NavLink[] = [
  { href: "/practitioner-onboarding", label: "Home" },

];

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-sm font-medium text-gray-600 hover:text-[#a4262c] transition-colors">
    {children}
  </a>
);


const NavDropdown = ({ label, subLinks }: { label: string; subLinks: { href: string; label: string }[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="text-sm font-medium text-gray-600 hover:text-[#a4262c] hover:bg-red-50 focus-visible:ring-offset-0 focus-visible:ring-0">
        {label}
        <ChevronDown className="w-4 h-4 ml-1" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="bg-white border-gray-200 text-gray-800">
      {subLinks.map(link => (
        <DropdownMenuItem key={link.href} asChild>
          <a href={link.href} className="cursor-pointer focus:bg-[#a4262c]/10 focus:text-[#a4262c]">{link.label}</a>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export function OnboardingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser(); // Get user data from the context

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Profile';

  return (
    <nav className="bg-white text-[#011d41] shadow-sm w-full border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <img src="/bv-logo-textless-color.png" alt="BestVisa" className="h-8 w-auto" />
              <h1 className="text-lg font-bold text-[#011d41]">BestVisa Portal</h1>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <a href="https://www.bestvisa.ca" target="_blank" className="text-sm font-bold text-[#011d41] hover:text-[#a4262c] px-3 py-2">
              BestVisa.ca
            </a>
            <div className="w-px h-6 bg-gray-300" />
            {navLinks.map(link => (
              link.subLinks
                ? <NavDropdown key={link.label} label={link.label} subLinks={link.subLinks} />
                : <NavLink key={link.label} href={link.href}>{link.label}</NavLink>
            ))}
            <div className="w-px h-6 bg-gray-300" />
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2 py-1 h-auto hover:bg-gray-100">
                  <img
                    src={user.profileImage || '/default-avatar.png'}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                  <span className="font-medium text-sm text-gray-700">{userName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200 text-gray-800">
                <DropdownMenuItem asChild><a href="/profile/" className="cursor-pointer focus:bg-[#a4262c]/10 focus:text-[#a4262c]">Profile</a></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><a href="/Account/Login/LogOff" className="cursor-pointer focus:bg-[#a4262c]/10 focus:text-[#a4262c]">Log off</a></DropdownMenuItem>
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
      <div className={cn("md:hidden bg-white border-t border-gray-200", isMobileMenuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map(link => (
            link.subLinks
              ? (
                <div key={link.label}>
                  <h3 className="text-gray-500 px-3 py-2">{link.label}</h3>
                  {link.subLinks.map(sub => <a key={sub.label} href={sub.href} className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-[#011d41]">{sub.label}</a>)}
                </div>
              )
              : <a key={link.label} href={link.href} className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-[#011d41]">{link.label}</a>
          ))}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center px-3 py-2">
              <img src={user.profileImage || '/default-avatar.png'} alt="Profile" className="h-10 w-10 rounded-full object-cover border" />
              <div className="ml-3">
                <p className="text-base font-medium text-gray-800">{userName}</p>
              </div>
            </div>
            <a href="/profile/" className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-[#011d41]">Profile</a>
            <a href="/Account/Login/LogOff" className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-[#011d41]">Log off</a>
          </div>
        </div>
      </div>
    </nav>
  );
}