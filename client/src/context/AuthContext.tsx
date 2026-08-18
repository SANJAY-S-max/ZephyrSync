import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, ServerSettings } from '../types';

interface AuthContextType {
  user: User | null;
  serverInfo: { status: string; settings: ServerSettings | null; lanIPs?: string[]; port?: number; primaryLanIP?: string | null } | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [serverInfo, setServerInfo] = useState<{ status: string; settings: ServerSettings | null; lanIPs?: string[]; port?: number; primaryLanIP?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const [meRes, settingsRes, infoRes] = await Promise.all([
        api.get('/auth/me').catch(() => null),
        api.get('/server/settings').catch(() => null),
        api.get('/server/info').catch(() => null)
      ]);
      
      if (meRes?.data) setUser(meRes.data);
      if (settingsRes?.data || infoRes) {
        setServerInfo({ 
          status: infoRes?.status || 'online', 
          settings: settingsRes?.data || null,
          lanIPs: infoRes?.lanIPs,
          port: infoRes?.port,
          primaryLanIP: infoRes?.primaryLanIP
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await api.get('/server/settings');
      if (res?.data) {
        setServerInfo(prev => ({ 
          ...prev, 
          status: prev?.status || 'online', 
          settings: res.data 
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    refreshSettings(); // load settings after login
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, serverInfo, loading, login, logout, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
