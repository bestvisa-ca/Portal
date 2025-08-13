// site-layouts/WithSidebarLayout.tsx
'use client';

import React from 'react';
import { UserProvider } from '../site-contexts/UserContext';
import SiteNavbar from './Site-Navbar';
import SiteSidebar from './Site-Sidebar';

export type NavbarVariant = 'practitioner' | 'applicant' | 'simple';
export type SidebarVariant = 'practitioner' | 'applicant';

export function WithSidebarLayout({
  children,
  navbarVariant = 'applicant',
  sidebarVariant = 'applicant',
  homeHref = '/',
}: {
  children: React.ReactNode;
  navbarVariant?: NavbarVariant;
  sidebarVariant?: SidebarVariant;
  homeHref?: string;
}) {
  <style>{`
  html, body { margin: 0; padding: 0; }
`}</style>
  return (
    <UserProvider>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#efefef' }}>
        <SiteNavbar variant={navbarVariant} homeHref={homeHref} />
        <div className="flex-1">
          {/* same outer gutter as screenshot */}
          <div className="mx-auto max-w-7xl px-4 py-6 ">
<div className="flex flex-col md:flex-row gap-0 md:gap-6">
              <SiteSidebar variant={sidebarVariant} />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </UserProvider>
  );
}
