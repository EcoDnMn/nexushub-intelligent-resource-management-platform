import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { api } from './api-client';
import type { User, AuthResponse } from '@shared/types';
type AuthContextType = {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Pick<User, 'email' | 'password'>) => Promise<void>;
  register: (userData: Pick<User, 'name' | 'email' | 'password'>) => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexus-token'));
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const storedToken = localStorage.getItem('nexus-token');
    const storedUser = localStorage.getItem('nexus-user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);
  const handleAuthSuccess = (data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('nexus-token', data.token);
    localStorage.setItem('nexus-user', JSON.stringify(data.user));
  };
  const login = async (credentials: Pick<User, 'email' | 'password'>) => {
    const data = await api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    handleAuthSuccess(data);
  };
  const register = async (userData: Pick<User, 'name' | 'email' | 'password'>) => {
    const data = await api<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    handleAuthSuccess(data);
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexus-token');
    localStorage.removeItem('nexus-user');
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};