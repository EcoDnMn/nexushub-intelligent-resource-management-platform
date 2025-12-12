import { useContext, createContext } from 'react';
import type { User } from '@shared/types';
type AuthContextType = {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Pick<User, 'email' | 'password'>) => Promise<void>;
  register: (userData: Pick<User, 'name' | 'email' | 'password'>) => Promise<void>;
  logout: () => void;
};
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
// This hook provides a safe way to access the AuthContext.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};