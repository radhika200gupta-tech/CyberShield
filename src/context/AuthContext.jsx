/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { mockUser } from '../data/mockUser';

const AuthContext = createContext(null);

// Phase 1: mock, localStorage-backed auth.
// Phase 2 swap: replace localStorage calls with services/authService.js
// calls to a Spring Boot /api/auth/* JWT endpoint — the shape of `user`
// and the exposed methods (login/signup/logout) stay the same.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cybershield-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);

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

  const updateUser = (data) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    
    if (data.name) {
      const names = data.name.trim().split(/\s+/);
      let initials = names[0].charAt(0).toUpperCase();
      if (names.length > 1) {
        initials += names[names.length - 1].charAt(0).toUpperCase();
      }
      updatedUser.avatarInitials = initials;
    }
    
    localStorage.setItem('cybershield-user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const resetPassword = async ({ email }) => {
    // Demonstration boundary for password reset simulation
    // In production, this would invoke services/authService.js to trigger a secure reset email
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, email };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout, updateUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
