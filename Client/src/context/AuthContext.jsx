import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, STORAGE_KEY } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(() => readSaved()?.user || null);
  const [loading, setLoading] = useState(!!readSaved()?.token); // true while verifying a saved session

  const save = (token, nextUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    setUser(nextUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Verify the saved token once on startup.
  useEffect(() => {
    const saved = readSaved();
    if (!saved?.token) return;
    authApi
      .me()
      .then(({ data }) => save(saved.token, data.user))
      .catch((err) => {
        if (err.response?.status === 401) logout(); // other errors (server down) keep the cached session
      })
      .finally(() => setLoading(false));
  }, [logout]);

  // Any 401 from a protected request ends the session gracefully.
  useEffect(() => {
    const onUnauthorized = (e) => {
      logout();
      toast.error(e.detail || 'Your session has expired. Please log in again.');
    };
    window.addEventListener('roomly:unauthorized', onUnauthorized);
    return () => window.removeEventListener('roomly:unauthorized', onUnauthorized);
  }, [logout, toast]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    save(data.token, data.user);
    return data.user;
  };

  // Only name, email and password are sent. The server decides the role.
  const register = async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password });
    save(data.token, data.user);
    return data.user;
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
