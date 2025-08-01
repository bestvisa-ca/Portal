import { createContext, useState, useContext, type ReactNode } from 'react';

interface User {
  firstName: string;
  lastName: string;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a Provider component that will wrap our app
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({ firstName: '', lastName: '' });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}


// Create a custom hook for easy access to the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}