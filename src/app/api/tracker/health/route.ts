import { apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import {
  getProjectState,
  hasDurablePersistence,
  readStore,
  storeMode,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  const store = await readStore();
  return apiSuccess({
    status: "ok",
    time: new Date().toISOString(),
    storeMode,
    hasDurablePersistence,
    projectStatus: getProjectState(store).status,
    developers: store.developers.length,
    milestones: store.milestones.length,
  });
}
