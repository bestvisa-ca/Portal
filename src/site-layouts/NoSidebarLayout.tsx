import React from "react";
import { UserProvider } from "../site-contexts/UserContext";
import SiteNavbar from "./Site-Navbar";

interface LayoutProps {
    children: React.ReactNode;
    navbarVariant?: "practitioner" | "applicant" | "simple";
    homeHref?: string;
}

export function NoSidebarLayout({
    children,
    navbarVariant = "simple",
    homeHref = "/",
}: LayoutProps) {
    return (
        <UserProvider>
            <div className="min-h-screen flex flex-col bg-[#efefef]">
                <SiteNavbar variant={navbarVariant} homeHref={homeHref} />
                <main className="flex-1">{children}</main>
            </div>
        </UserProvider>
    );
}
