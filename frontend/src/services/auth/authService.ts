import { apiRequest, refreshSession, setAccessToken } from "../../lib/apiClient";
import type { AuthSession, LoginInput } from "../../types/auth";

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const session = await apiRequest<AuthSession>("/auth/login/", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    });
    setAccessToken(session.access);
    return session;
  },

  // Restores a session from the refresh cookie (e.g. after a page reload).
  restore(): Promise<AuthSession | null> {
    return refreshSession();
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<void>("/auth/logout/", { method: "POST", skipAuthRetry: true });
    } finally {
      setAccessToken(null);
    }
  },
};
