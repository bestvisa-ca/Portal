'use client'

import { useState, useEffect } from 'react';

// Define the structure for each navigation link
interface NavLink {
  href: string;
  label: string;
  icon: string;
}

const navLinks: NavLink[] = [
    { href: "/Practitioner-Dashboard/", icon: "🎯", label: "Dashboard" },
    { href: "/Practitioner-Dashboard/Practitioner-Requests/", icon: "👨‍👧‍👧", label: "Requests For Consultation" },
    { href: "/Practitioner-Dashboard/Practitioner-Offers/", icon: "🧾", label: "Offers & Contracts" },
    { href: "/Practitioner-Dashboard/Practitioner-Cases/", icon: "🗂️", label: "Active Cases" },
    { href: "/Practitioner-Dashboard/practitioner-financial/", icon: "💰", label: "Financial" },
    { href: "/Practitioner-Dashboard/practitioner-settings", icon: "⚙️", label: "Settings" },
];

export function Sidebar() {
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  return (
    <div className="sidebar mt-20 ml-10">
      <div className="sidebar-header">
        <h2>Practitioner Panel</h2>
        <hr />
      </div>

      <ul className="sidebar-menu">
        {navLinks.map(link => (
          <li className="menu-item" key={link.href}>
            <a 
              href={link.href} 
              className={`menu-link ${activeLink.startsWith(link.href) ? 'active' : ''}`}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}