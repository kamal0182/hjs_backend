export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isAdmin: boolean;
  isActive: boolean;
  dateJoined: string;
}

// Returned by /auth/login/ and /auth/refresh/. The refresh token itself is
// never exposed to JavaScript: the backend keeps it in an HttpOnly cookie.
export interface AuthSession {
  access: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}
