import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, Permission, UserRole } from '../types';
import { useData } from './DataContext';
import useLocalStorage from '../hooks/useLocalStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedUser, setStoredUser] = useLocalStorage<User | null>('currentUser_v1', null);
  const [user, setUser] = useState<User | null>(storedUser);
  const [loading, setLoading] = useState(true);
  const { users: allUsers, loadingData } = useData();

  useEffect(() => {
    if (!loadingData) {
      // Once data is loaded, verify the stored user still exists in the main user list.
      if (storedUser) {
        const freshUser = allUsers.find(u => u.id === storedUser.id);
        if (freshUser) {
          // Update user state with the latest data from the source of truth
          setUser(freshUser);
        } else {
          // User might have been deleted, so clear session.
          setUser(null);
          setStoredUser(null);
        }
      }
      setLoading(false);
    }
  }, [loadingData, storedUser, allUsers, setStoredUser]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (loadingData) {
      console.error("Data is not ready for login.");
      return false;
    }
    setLoading(true);
    // Find user by username
    const userToLogin = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    // Check if user exists and password matches
    if (userToLogin && userToLogin.password === password) {
      setUser(userToLogin);
      setStoredUser(userToLogin);
      setLoading(false);
      return true;
    }

    // Login failed
    setUser(null);
    setStoredUser(null);
    setLoading(false);
    return false;
  }, [allUsers, setStoredUser, loadingData]);

  const logout = useCallback(async () => {
    setUser(null);
    setStoredUser(null);
  }, [setStoredUser]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    // Admin role has all permissions implicitly
    if (user.role === UserRole.ADMIN) return true;
    // Otherwise, check the permissions array
    return user.permissions.includes(permission);
  }, [user]);

  // Render children only when auth state is resolved and data is loaded.
  const isReady = !loading && !loadingData;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {isReady ? children : (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
        </div>
      )}
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