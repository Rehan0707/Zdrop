'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, ShopProfile } from './types';

interface RegisterShopData {
  shopName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  campusAddress: string;
  shopCode?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  shop: ShopProfile | null;
  isLoading: boolean;
  loginWithGoogle: (redirectTo?: string) => void;
  loginWithDevMock: (name?: string, email?: string) => Promise<void>;
  loginShopOwner: (email: string, password: string) => Promise<void>;
  registerShopOwner: (data: RegisterShopData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setShop(data.shop || null);
      } else {
        setUser(null);
        setShop(null);
      }
    } catch {
      setUser(null);
      setShop(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithGoogle = (redirectTo = window.location.pathname) => {
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`;
  };

  const loginWithDevMock = async (name?: string, email?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/mock-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginShopOwner = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/shop/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser(data.user);
      setShop(data.shop || null);
    } finally {
      setIsLoading(false);
    }
  };

  const registerShopOwner = async (data: RegisterShopData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/shop/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Registration failed');
      setUser(resData.user);
      setShop(resData.shop || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setShop(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isLoading,
        loginWithGoogle,
        loginWithDevMock,
        loginShopOwner,
        registerShopOwner,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
