import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
// This hook is now in its own file to satisfy the react-refresh/only-export-components lint rule.
// It provides a safe way to access the AuthContext.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};