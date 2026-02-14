import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createToken, sanitizeUser } from "@/lib/tracker/server/auth";
import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureString, readStore, writeStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SetupPasswordPayload {
  email?: string;
  setupToken?: string;
  password?: string;
  confirmPassword?: string;
}

function hashSetupToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  let body: SetupPasswordPayload;
  try {
    body = (await request.json()) as SetupPasswordPayload;
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const email = ensureString(body.email).toLowerCase();
  const setupToken = ensureString(body.setupToken);
  const password = ensureString(body.password);
  const confirmPassword = ensureString(body.confirmPassword);

  if (!email || !setupToken || !password || !confirmPassword) {
    return apiError(
      "email, setupToken, password and confirmPassword are required.",
      400,
    );
  }

  if (password !== confirmPassword) {
    return apiError("Password and confirmPassword do not match.", 400);
  }

  if (password.length < 8) {
    return apiError("Password must be at least 8 characters.", 400);
  }

  const store = await readStore();
  const user = store.users.find(
    (candidate) => candidate.email.toLowerCase() === email,
  );

  if (!user) {
    return apiError("Account not found for this email.", 404);
  }

  const passwordConfigured = user.passwordSet ?? Boolean(user.passwordHash);
  if (passwordConfigured) {
    return apiError("Password has already been configured for this account.", 409);
  }

  if (!user.setupTokenHash || !user.setupTokenExpiresAt) {
    return apiError("No active setup token exists for this account.", 400);
  }

  const setupTokenHash = hashSetupToken(setupToken);
  if (setupTokenHash !== user.setupTokenHash) {
    return apiError("Invalid setup token.", 401);
  }

  if (new Date(user.setupTokenExpiresAt).getTime() < Date.now()) {
    return apiError("Setup token has expired. Ask admin for a new token.", 401);
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.passwordSet = true;
  user.status = "active";
  delete user.setupTokenHash;
  delete user.setupTokenExpiresAt;

  await writeStore(store);

  return apiSuccess({
    token: createToken(user),
    user: sanitizeUser(user),
  });
}
