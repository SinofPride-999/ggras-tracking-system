import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { requireAuth } from "@/lib/tracker/server/guards";
import {
  buildDeveloperSnapshot,
  ensureString,
  getDefaultWeekStart,
  getProjectState,
  normalizeDate,
  readStore,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== "admin" && !auth.user.developerId) {
    return apiError("Developer account is not linked to a developer profile.", 403);
  }

  const store = await readStore();
  const url = new URL(request.url);
  const weekStart = normalizeDate(url.searchParams.get("weekStart")) || getDefaultWeekStart(store);

  let developerId = ensureString(url.searchParams.get("developerId"));
  if (auth.user.role !== "admin") {
    developerId = auth.user.developerId || "";
  }

  const developer = store.developers.find((item) => item.id === developerId);
  if (!developer) return apiError("Developer not found.", 404);

  return apiSuccess({
    weekStart,
    project: getProjectState(store),
    snapshot: buildDeveloperSnapshot(store, developer, weekStart),
  });
}
