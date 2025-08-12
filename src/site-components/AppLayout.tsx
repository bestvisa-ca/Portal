import { Navbar } from './Navbar';
import { Sidebar } from './practitioner-sidebar';
import { UserProvider } from '../site-contexts/UserContext'; // Import the provider
import { Toaster } from "../components/ui/sonner"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider> {/* Wrap the layout with UserProvider to provide user context */}
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow bg-[#efefef] p-0 md:p-4 flex justify-center">
          <div className="w-full max-w-7xl flex bg-white rounded-lg shadow-lg overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </UserProvider>
  );
}