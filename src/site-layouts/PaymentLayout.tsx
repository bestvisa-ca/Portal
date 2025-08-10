// OnboardingLayout.tsx

import { UserProvider } from '../site-forms/UserContext'; 
import { Toaster } from "../../src/components/ui/sonner"; 
import { SimpleNavbar } from './SimpleNavbar'; 

export function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SimpleNavbar />
      {children}
      <Toaster richColors position="top-right" />
    </UserProvider>
  );
}