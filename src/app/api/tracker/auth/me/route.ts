import { readBearerToken, sanitizeUser, verifyToken } from "@/lib/tracker/server/auth";
import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { readStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request);
  if (!token) {
    return apiError("Authentication token is required.", 401);
  }

  const authUser = verifyToken(token);
  if (!authUser) {
    return apiError("Invalid or expired authentication token.", 401);
  }

  const store = await readStore();
  const user = store.users.find((candidate) => candidate.id === authUser.id);
  if (!user) {
    return apiError("User account no longer exists.", 404);
  }

  if (user.status === "disabled") {
    return apiError("This account is disabled.", 403);
  }

  return apiSuccess({ user: sanitizeUser(user) });
}
