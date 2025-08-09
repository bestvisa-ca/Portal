// OnboardingLayout.tsx

import { UserProvider } from './UserContext'; // Adjust path if needed
import { Toaster } from "../../src/components/ui/sonner"; // Optional: if you want notifications
import { OnboardingNavbar } from './OnboardingNavbar'; // Adjust path if needed

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    // This provider makes the user context available to any child component,
    // like your PractitionerServicesForm, without rendering the Navbar or Sidebar.
    <UserProvider>
      <OnboardingNavbar />
      {children}
      <Toaster richColors position="top-right" />
    </UserProvider>
  );
}