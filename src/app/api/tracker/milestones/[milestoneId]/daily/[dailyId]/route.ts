import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { requireAuth } from "@/lib/tracker/server/guards";
import {
  calculateMilestoneStats,
  clampNumber,
  ensureString,
  normalizeDailyStatus,
  readStore,
  writeStore,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchPayload {
  status?: string;
  completionRate?: number;
  notes?: string;
  title?: string;
  estimatedHours?: number;
}

export async function PATCH(
  request: Request,
  context: { params: { milestoneId: string; dailyId: string } },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { milestoneId, dailyId } = context.params;
  let body: PatchPayload;

  try {
    body = (await request.json()) as PatchPayload;
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const store = await readStore();
  const milestone = store.milestones.find((item) => item.id === milestoneId);
  if (!milestone) return apiError("Milestone not found.", 404);

  if (auth.user.role !== "admin" && milestone.developerId !== auth.user.developerId) {
    return apiError("You can only update your own milestones.", 403);
  }

  const dailyMilestone = milestone.dailyMilestones.find((item) => item.id === dailyId);
  if (!dailyMilestone) return apiError("Daily milestone not found.", 404);

  if (body.status !== undefined) {
    const requestedStatus = ensureString(body.status).toLowerCase();
    const normalizedStatus = normalizeDailyStatus(requestedStatus);
    if (!requestedStatus || requestedStatus !== normalizedStatus) {
      return apiError("Invalid status provided.", 400);
    }
    dailyMilestone.status = normalizedStatus;
  }

  if (body.completionRate !== undefined) {
    dailyMilestone.completionRate = clampNumber(
      body.completionRate,
      0,
      100,
      dailyMilestone.completionRate,
    );
  }

  if (body.notes !== undefined) {
    dailyMilestone.notes = ensureString(body.notes);
  }

  if (body.title !== undefined) {
    dailyMilestone.title = ensureString(body.title);
  }

  if (body.estimatedHours !== undefined) {
    dailyMilestone.estimatedHours = clampNumber(body.estimatedHours, 0, 24, 8);
  }

  dailyMilestone.updatedAt = new Date().toISOString();
  milestone.updatedAt = new Date().toISOString();

  await writeStore(store);

  return apiSuccess({
    item: {
      ...milestone,
      stats: calculateMilestoneStats(milestone),
    },
  });
}
