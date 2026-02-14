import type { NextResponse } from "next/server";
import { apiError } from "./http";
import { readBearerToken, type AuthTokenUser, verifyToken } from "./auth";

interface AuthResult {
  user: AuthTokenUser;
  error: null;
}

interface AuthErrorResult {
  user: null;
  error: NextResponse;
}

export function requireAuth(request: Request): AuthResult | AuthErrorResult {
  const token = readBearerToken(request);
  if (!token) {
    return {
      user: null,
      error: apiError("Authentication token is required.", 401),
    };
  }

  const user = verifyToken(token);
  if (!user) {
    return {
      user: null,
      error: apiError("Invalid or expired authentication token.", 401),
    };
  }

  return { user, error: null };
}

export function ensureRole(
  user: AuthTokenUser,
  roles: Array<AuthTokenUser["role"]>,
) {
  if (roles.includes(user.role)) {
    return null;
  }
  return apiError("You do not have permission for this action.", 403);
}
