import { apiSuccess } from "@/lib/tracker/server/http";
import {
  getProjectState,
  hasDurablePersistence,
  readStore,
  storeMode,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
