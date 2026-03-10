import { createContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { startAuthentication } from '@simplewebauthn/browser';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    return api.get('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email, password, rememberMe = true) => {
    const data = await api.post('/api/auth/login', { email, password, rememberMe });
    if (data?.requiresAdminVerification) {
      return data;
    }
    setUser(data);
    return data;
  }, []);

  const loginWithPasskey = useCallback(async (email, rememberMe = true) => {
    const options = await api.post('/api/auth/passkey/auth/options', { email });
    const response = await startAuthentication({ optionsJSON: options });
    const data = await api.post('/api/auth/passkey/auth', { email, response, rememberMe });
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.post('/api/auth/register', { name, email, password });
    return data;
  }, []);

  const resendVerification = useCallback(async (email) => {
    const data = await api.post('/api/auth/resend-verification', { email });
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithPasskey, register, logout, refreshUser, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}
