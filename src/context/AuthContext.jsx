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
          // The status endpoint checks token validity. Some apps return user info here.
          // For now, if we have a token, we might need to load user from local storage
          // or from a /me endpoint if it exists. 
          // The login endpoint returns user and permissions. We should store them.
          const storedUser = localStorage.getItem('hotelia_user');
          const storedPerms = localStorage.getItem('hotelia_permissions');
          if (storedUser && storedPerms) {
            setUser(JSON.parse(storedUser));
            setPermissions(JSON.parse(storedPerms));
          } else {
            // Token exists but no user info, we might want to log out
            logout();
          }
        } catch (error) {
          console.error('Failed to initialize auth', error);
          logout();
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
    if (user?.roles?.some(role => role === 'super_admin' || role.name === 'super_admin')) {
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
