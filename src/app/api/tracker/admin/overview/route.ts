import { apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import {
  buildAdminOverview,
  getLatestWeekStart,
  normalizeDate,
  readStore,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  const store = await readStore();
  const url = new URL(request.url);
  const weekStart = normalizeDate(url.searchParams.get("weekStart")) || getLatestWeekStart(store);

  return apiSuccess(buildAdminOverview(store, weekStart));
}
