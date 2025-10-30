import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { apiCall } from '../utils/api';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar: string;
  bio: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAccessToken(session.access_token);
          localStorage.setItem('accessToken', session.access_token);
          await loadUser(session.user.id);
        } else {
          localStorage.removeItem('accessToken');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }

  async function loadUser(userId: string) {
    try {
      const userData = await apiCall(`/user/${userId}`);
      setUser(userData);
    } catch (error) {
      console.error('Load user error:', error);
    }
  }

  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const token = data.session?.access_token;
      if (!token) throw new Error('No access token received');

      setAccessToken(token);
      localStorage.setItem('accessToken', token);
      await loadUser(data.user.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function signup(email: string, password: string, username: string) {
    try {
      const response = await apiCall('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, username }),
      });

      if (response.error) throw new Error(response.error);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return;

    try {
      const updatedUser = await apiCall(`/user/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
