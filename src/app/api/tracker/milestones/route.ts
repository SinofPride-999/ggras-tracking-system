import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import {
  calculateMilestoneStats,
  clampNumber,
  ensureString,
  getDefaultWeekStart,
  getProjectState,
  getWeekRange,
  nextId,
  normalizeDate,
  normalizeDailyStatus,
  readStore,
  writeStore,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== "admin" && !auth.user.developerId) {
    return apiError("Developer account is not linked to a developer profile.", 403);
  }

  const store = await readStore();
  const url = new URL(request.url);
  const weekStartParam = normalizeDate(url.searchParams.get("weekStart"));
  const effectiveWeekStart = weekStartParam || getDefaultWeekStart(store);
  const requestedDeveloperId = ensureString(url.searchParams.get("developerId"));

  let developerIdFilter = requestedDeveloperId;
  if (auth.user.role !== "admin") {
    developerIdFilter = auth.user.developerId || "";
  }

  const filtered = store.milestones.filter((milestone) => {
    if (effectiveWeekStart && normalizeDate(milestone.weekStart) !== effectiveWeekStart) {
      return false;
    }
    if (developerIdFilter && milestone.developerId !== developerIdFilter) {
      return false;
    }
    return true;
  });

  const items = filtered
    .sort((a, b) => {
      const weekDelta = new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      if (weekDelta !== 0) return weekDelta;
      return a.developerId.localeCompare(b.developerId);
    })
    .map((milestone) => ({
      ...milestone,
      stats: calculateMilestoneStats(milestone),
    }));

  return apiSuccess({
    weekStart: effectiveWeekStart,
    project: getProjectState(store),
    items,
  });
}

interface CreateMilestonePayload {
  developerId?: string;
  weekStart?: string;
  weekEnd?: string;
  weeklyGoal?: string;
  targetCompletionRate?: number;
  dailyMilestones?: Array<{
    id?: string;
    date?: string;
    title?: string;
    status?: string;
    completionRate?: number;
    estimatedHours?: number;
    notes?: string;
  }>;
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  let body: CreateMilestonePayload;
  try {
    body = (await request.json()) as CreateMilestonePayload;
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const store = await readStore();
  const developerId = ensureString(body.developerId);
  const weekStart = normalizeDate(body.weekStart);
  const weeklyGoal = ensureString(body.weeklyGoal);
  const targetCompletionRate = clampNumber(body.targetCompletionRate, 0, 100, 100);

  if (!developerId || !weekStart || !weeklyGoal) {
    return apiError("developerId, weekStart and weeklyGoal are required.", 400);
  }

  const developer = store.developers.find((candidate) => candidate.id === developerId);
  if (!developer) {
    return apiError("Developer does not exist.", 404);
  }

  const existing = store.milestones.find(
    (milestone) =>
      milestone.developerId === developerId &&
      normalizeDate(milestone.weekStart) === weekStart,
  );
  if (existing) {
    return apiError("A milestone already exists for this developer and week.", 409);
  }

  const weekRange = getWeekRange(weekStart);
  const weekEnd = normalizeDate(body.weekEnd) || weekRange?.weekEnd || weekStart;
  const dailyInput = Array.isArray(body.dailyMilestones) ? body.dailyMilestones : [];

  const dailyMilestones = dailyInput.map((item, index) => {
    const defaultDate =
      weekRange?.dates[Math.min(index, weekRange.dates.length - 1)] || weekStart;
    return {
      id: ensureString(item.id) || nextId("daily"),
      date: normalizeDate(item.date) || defaultDate,
      title: ensureString(item.title) || `Daily milestone ${index + 1}`,
      status: normalizeDailyStatus(item.status),
      completionRate: clampNumber(item.completionRate, 0, 100, 0),
      estimatedHours: clampNumber(item.estimatedHours, 0, 24, 8),
      notes: ensureString(item.notes),
      updatedAt: new Date().toISOString(),
    };
  });

  const milestone = {
    id: nextId("milestone"),
    developerId,
    weekStart,
    weekEnd,
    weeklyGoal,
    targetCompletionRate,
    dailyMilestones,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.milestones.push(milestone);
  await writeStore(store);

  return apiSuccess(
    {
      item: {
        ...milestone,
        stats: calculateMilestoneStats(milestone),
      },
    },
    201,
  );
}
