import bcrypt from "bcryptjs";
import { createToken, sanitizeUser } from "@/lib/tracker/server/auth";
import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureString, readStore, writeStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SetupPasswordPayload {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export async function POST(request: Request) {
  let body: SetupPasswordPayload;
  try {
    body = (await request.json()) as SetupPasswordPayload;
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const email = ensureString(body.email).toLowerCase();
  const password = ensureString(body.password);
  const confirmPassword = ensureString(body.confirmPassword);

  if (!email || !password || !confirmPassword) {
    return apiError(
      "email, password and confirmPassword are required.",
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
  if (user.role !== "developer") {
    return apiError("Password setup is only allowed for developer accounts.", 403);
  }
  if (user.status === "disabled") {
    return apiError("This account is disabled. Contact admin.", 403);
  }
  if ((user.status || "invited") !== "invited") {
    return apiError("Password has already been configured for this account.", 409);
  }

  const passwordConfigured = user.passwordSet ?? Boolean(user.passwordHash);
  if (passwordConfigured) {
    return apiError("Password has already been configured for this account.", 409);
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.passwordSet = true;
  user.status = "active";

  await writeStore(store);

  return apiSuccess({
    token: createToken(user),
    user: sanitizeUser(user),
  });
}
