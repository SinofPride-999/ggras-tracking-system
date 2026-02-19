import type { NextResponse } from "next/server";
import { apiError } from "./http";
import { readBearerToken, sanitizeUser, type AuthTokenUser, verifyToken } from "./auth";
import { readStore, type TrackerStoreUser } from "./store";

interface AuthResult {
  user: AuthTokenUser;
  error: null;
}

interface AuthErrorResult {
  user: null;
  error: NextResponse;
}

function resolveUserStatus(user: TrackerStoreUser) {
  if (user.status) return user.status;
  const hasPassword = user.passwordSet ?? Boolean(user.passwordHash);
  return hasPassword ? "active" : "invited";
}

export async function requireAuth(
  request: Request,
): Promise<AuthResult | AuthErrorResult> {
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

  const store = await readStore();
  const storeUser = store.users.find((candidate) => candidate.id === user.id);
  if (!storeUser) {
    return {
      user: null,
      error: apiError("User account no longer exists.", 401),
    };
  }

  const status = resolveUserStatus(storeUser);
  if (status === "disabled") {
    return {
      user: null,
      error: apiError("This account is disabled.", 403),
    };
  }
  if (status !== "active") {
    return {
      user: null,
      error: apiError("Account setup is incomplete. Set your password first.", 403),
    };
  }

  return { user: sanitizeUser(storeUser), error: null };
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
