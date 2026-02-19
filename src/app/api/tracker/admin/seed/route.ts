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
  resetUsersToAdminOnly?: boolean;
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
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
  const resetUsersToAdminOnly = body.resetUsersToAdminOnly === true;
  const clearDevelopers = body.clearDevelopers === true;

  if (resetUsersToAdminOnly) {
    const admins = store.users.filter((user) => user.role === "admin");
    if (admins.length === 0) {
      return apiError("No admin account found. Seed an admin account first.", 400);
    }
    store.users = admins.map((admin) => ({
      ...admin,
      name: "",
      role: "admin",
      developerId: undefined,
      status: admin.status || "active",
    }));
  }

  if (clearDevelopers) {
    store.developers = [];
    store.milestones = [];
    store.progressReports = [];
    store.users = store.users.filter((user) => user.role === "admin");
    store.project = {
      status: "not_started",
      startDate: null,
      startedAt: null,
      startedBy: null,
      totalWeeks: 0,
    };
  }

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
