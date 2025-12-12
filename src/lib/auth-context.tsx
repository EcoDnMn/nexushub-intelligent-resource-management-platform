import React, { useState, useEffect, ReactNode } from 'react';
import { api } from './api-client';
import type { User, AuthResponse } from '@shared/types';
import { AuthContext } from '@/hooks/useAuth';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexus-token'));
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const storedToken = localStorage.getItem('nexus-token');
    const storedUser = localStorage.getItem('nexus-user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        // Clear corrupted data
        localStorage.removeItem('nexus-user');
        localStorage.removeItem('nexus-token');
      }
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