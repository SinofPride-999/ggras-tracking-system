import bcrypt from "bcryptjs";
import { createToken, sanitizeUser } from "@/lib/tracker/server/auth";
import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureString, readStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const input = body as { email?: string; password?: string };
  const email = ensureString(input.email).toLowerCase();
  const password = ensureString(input.password);

  if (!email || !password) {
    return apiError("Email and password are required.", 400);
  }

  const store = await readStore();
  const user = store.users.find(
    (candidate) => candidate.email.toLowerCase() === email,
  );

  if (!user) {
    return apiError("Invalid email or password.", 401);
  }

  if (user.status === "disabled") {
    return apiError("This account is disabled. Contact admin.", 403);
  }

  const passwordConfigured = user.passwordSet ?? Boolean(user.passwordHash);
  if (!passwordConfigured || !user.passwordHash) {
    return apiSuccess({
      requiresSetup: true,
      setupRequired: true,
      message:
        "Account setup is required. Use your setup token to set your password.",
    });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return apiError("Invalid email or password.", 401);
  }

  return apiSuccess({
    token: createToken(user),
    user: sanitizeUser(user),
  });
}
