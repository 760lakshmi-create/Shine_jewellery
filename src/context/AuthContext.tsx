import { createContext, ReactNode, useContext, useState } from 'react';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('shine_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (nextUser: AuthUser, token: string) => {
    localStorage.setItem('shine_user', JSON.stringify(nextUser));
    localStorage.setItem('shine_customer_token', token);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('shine_user');
    localStorage.removeItem('shine_customer_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
