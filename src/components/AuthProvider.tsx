"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthToken,
  clearStoredUser,
  getAuthToken,
  getStoredUser,
  setAuthToken,
  setStoredUser,
  type AuthUser,
} from "@/lib/auth";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  function applyLogin(nextToken: string, nextUser: AuthUser) {
    setAuthToken(nextToken);
    setStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    clearAuthToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  async function refreshMe() {
    const currentToken = getAuthToken();
    if (!currentToken) return;

    const response = await fetch(`${API_BASE}/auth/me`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!response.ok) {
      logout();
      return;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const nextUser: AuthUser = {
      id: Number(data.id),
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      role: data.role != null ? String(data.role) : undefined,
      avatarUrl: data.avatar_url != null ? String(data.avatar_url) : null,
    };

    setStoredUser(nextUser);
    setUser(nextUser);
  }

  useEffect(() => {
    const existingToken = getAuthToken();
    const existingUser = getStoredUser();
    setToken(existingToken);
    setUser(existingUser);
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isReady,
      login: applyLogin,
      logout,
      refreshMe,
    }),
    [token, user, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

