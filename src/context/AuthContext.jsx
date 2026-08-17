import { createContext, useContext, useEffect, useState } from 'react';
import { mockUser } from '../data/mockUser';

const AuthContext = createContext(null);

// Phase 1: mock, localStorage-backed auth.
// Phase 2 swap: replace localStorage calls with services/authService.js
// calls to a Spring Boot /api/auth/* JWT endpoint — the shape of `user`
// and the exposed methods (login/signup/logout) stay the same.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cybershield-user');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const login = async ({ email }) => {
    const sessionUser = { ...mockUser, email };
    localStorage.setItem('cybershield-user', JSON.stringify(sessionUser));
    localStorage.setItem('cybershield-token', 'mock-jwt-token');
    setUser(sessionUser);
    return sessionUser;
  };

  const signup = async ({ name, email }) => {
    const sessionUser = { ...mockUser, name, email };
    localStorage.setItem('cybershield-user', JSON.stringify(sessionUser));
    localStorage.setItem('cybershield-token', 'mock-jwt-token');
    setUser(sessionUser);
    return sessionUser;
  };

  const logout = () => {
    localStorage.removeItem('cybershield-user');
    localStorage.removeItem('cybershield-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
