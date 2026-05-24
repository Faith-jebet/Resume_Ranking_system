import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearStoredToken, fetchCurrentUser, getStoredToken, loginUser, registerUser, storeToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await fetchCurrentUser(token);
        if (!cancelled) {
          setUser(response?.user || null);
        }
      } catch (error) {
        if (!cancelled) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const authValue = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    async login(credentials) {
      const response = await loginUser(credentials);
      storeToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response;
    },
    async signup(credentials) {
      const response = await registerUser(credentials);
      storeToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      return response;
    },
    logout() {
      clearStoredToken();
      setToken(null);
      setUser(null);
    },
  }), [isBootstrapping, token, user]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}