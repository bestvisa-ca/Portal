'use client';

import React, { useState } from 'react';
import { UserProvider } from '../site-contexts/UserContext';
import SiteNavbar from './Site-Navbar';
import SiteSidebar, { type SidebarVariant } from './Site-Sidebar';
import { cn } from '../lib/utils';

interface LayoutProps {
  navbarVariant?: 'practitioner' | 'applicant' | 'simple';
  sidebarVariant?: SidebarVariant;
  homeHref?: string;

  /** Pass in a fully styled title block component (e.g. PageTitle) */
  pageTitle?: React.ReactNode;

  toolbarItems: { key: string; label: string; icon?: React.ElementType }[];
  defaultActiveKey?: string;
  renderContent: (activeKey: string) => React.ReactNode;
}

export function WithSidebarToolbarLayout({
  navbarVariant = 'applicant',
  sidebarVariant = 'applicant',
  homeHref = '/',
  pageTitle,
  toolbarItems,
  defaultActiveKey,
  renderContent,
}: LayoutProps) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey ?? toolbarItems[0]?.key ?? '');

  return (
    <UserProvider>
      <div className="min-h-screen flex flex-col bg-[#efefef]">
        <SiteNavbar variant={navbarVariant} homeHref={homeHref} />
        <div className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col md:flex-row gap-0 md:gap-6">
              <SiteSidebar variant={sidebarVariant} />
              <main className="flex-1">
                
                {/* ===== Continuous White Container ===== */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  
                  {/* ===== Page Title Area (customizable) ===== */}
                  {pageTitle && (
                    <div className="p-6 pb-4">
                      {pageTitle}
                    </div>
                  )}

                  {/* Divider */}
                  <hr className="border-t border-gray-200" />

                  {/* ===== Toolbar ===== */}
                  <div className="p-6 pb-2 flex flex-wrap gap-2 bg-[#f9f9f9]">
                    {toolbarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeKey === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveKey(item.key)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-[#a4262c] text-white shadow-sm'
                              : 'bg-white text-[#011d41] hover:bg-gray-100 ring-1 ring-gray-200'
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* ===== Content ===== */}
                  <div className="p-6">
                    {renderContent(activeKey)}
                  </div>
                </div>
                
              </main>
            </div>
          </div>
        </div>
      </div>
    </UserProvider>
  );
}
