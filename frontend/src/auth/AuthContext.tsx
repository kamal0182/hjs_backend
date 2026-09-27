import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setSessionExpiredHandler } from "../lib/apiClient";
import { authService } from "../services/auth/authService";
import type { AuthUser, LoginInput } from "../types/auth";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    authService.restore().then((session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setStatus(session ? "authenticated" : "anonymous");
    });

    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });

    return () => {
      cancelled = true;
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const session = await authService.login(input);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isAdmin: Boolean(user?.isAdmin), login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
