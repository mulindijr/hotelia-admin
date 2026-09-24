import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('hotelia_token');
      if (token) {
        try {
          // Fetch fresh user data from API to ensure roles/permissions are up to date
          const response = await authApi.me();
          if (response.data?.user) {
            const userData = response.data.user;
            setUser(userData);
            // Permissions might come separately or within user object depending on backend
            // In our AuthController, /me returns user with loaded roles and permissions. 
            // We should use the roles/permissions from the fresh user object.
            const userPerms = userData.permissions?.map(p => p.name) || [];
            setPermissions(userPerms);
            
            // Update local storage so it stays fresh
            localStorage.setItem('hotelia_user', JSON.stringify(userData));
            localStorage.setItem('hotelia_permissions', JSON.stringify(userPerms));
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to initialize auth', error);
          // Only logout if it's an auth error (401), not a network error
          if (error.response?.status === 401) {
            logout();
          } else {
            // Fallback to local storage if API is temporarily down
            const storedUser = localStorage.getItem('hotelia_user');
            const storedPerms = localStorage.getItem('hotelia_permissions');
            if (storedUser) setUser(JSON.parse(storedUser));
            if (storedPerms) setPermissions(JSON.parse(storedPerms));
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (data) => {
    localStorage.setItem('hotelia_token', data.token);
    localStorage.setItem('hotelia_user', JSON.stringify(data.user));
    localStorage.setItem('hotelia_permissions', JSON.stringify(data.permissions));
    setUser(data.user);
    setPermissions(data.permissions || []);
    navigate('/');
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('hotelia_token')) {
        await authApi.logout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('hotelia_token');
      localStorage.removeItem('hotelia_user');
      localStorage.removeItem('hotelia_permissions');
      setUser(null);
      setPermissions([]);
      navigate('/login');
    }
  };

  const hasPermission = (permission) => {
    // Super admins bypass permission checks
    if (user?.is_super_admin || user?.roles?.some(role => role === 'super_admin' || role.name === 'super_admin')) {
      return true;
    }
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
