import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import { importMilestonesFromMarkdown } from "@/lib/tracker/server/md-import";
import { ensureString, readStore, writeStore } from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SeedPayload {
  baseWeekStart?: string;
  planFiles?: string[];
  clearDevelopers?: boolean;
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  let body: SeedPayload = {};
  try {
    body = (await request.json()) as SeedPayload;
  } catch {
    // Empty payload is acceptable.
  }

  const store = await readStore();

  if (body.clearDevelopers) {
    const linkedDeveloperIds = new Set(
      store.users
        .filter((user) => user.role === "developer" && user.developerId)
        .map((user) => user.developerId as string),
    );
    store.developers = store.developers.filter((developer) =>
      linkedDeveloperIds.has(developer.id),
    );
  }

  // Rebuild milestone timeline from source markdown plans.
  store.milestones = [];
  store.progressReports = [];
  store.project = {
    status: "not_started",
    startDate: null,
    startedAt: null,
    startedBy: null,
    totalWeeks: 0,
  };

  const summary = await importMilestonesFromMarkdown(store, {
    baseWeekStart: ensureString(body.baseWeekStart),
    planFiles: Array.isArray(body.planFiles) ? body.planFiles : undefined,
  });

  if (summary.filesProcessed === 0 && summary.warnings.length > 0) {
    return apiError(summary.warnings[0], 400);
  }

  await writeStore(store);

  return apiSuccess({
    summary,
    project: store.project,
  });
}

