import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { requireAuth } from "@/lib/tracker/server/guards";
import { readStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== "admin" && !auth.user.developerId) {
    return apiError("Developer account is not linked to a developer profile.", 403);
  }

  const store = await readStore();
  if (auth.user.role === "admin") {
    return apiSuccess({ items: store.developers });
  }

  const developer = store.developers.find(
    (candidate) => candidate.id === auth.user.developerId,
  );
  return apiSuccess({ items: developer ? [developer] : [] });
}
