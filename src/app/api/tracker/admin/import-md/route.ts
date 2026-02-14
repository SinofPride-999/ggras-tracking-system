import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import { importMilestonesFromMarkdown } from "@/lib/tracker/server/md-import";
import { ensureString, readStore, writeStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ImportPayload {
  baseWeekStart?: string;
  planFiles?: string[];
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  let body: ImportPayload = {};
  try {
    body = (await request.json()) as ImportPayload;
  } catch {
    // No body is acceptable.
  }

  const store = await readStore();
  const summary = await importMilestonesFromMarkdown(store, {
    baseWeekStart: ensureString(body.baseWeekStart),
    planFiles: Array.isArray(body.planFiles) ? body.planFiles : undefined,
  });

  if (summary.filesProcessed === 0 && summary.warnings.length > 0) {
    return apiError(summary.warnings[0], 400);
  }

  await writeStore(store);

  return apiSuccess({ summary });
}
