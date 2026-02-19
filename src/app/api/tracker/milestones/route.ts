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

function compareDevelopersForOrdering(
  left: { id: string; name?: string; team?: string } | undefined,
  right: { id: string; name?: string; team?: string } | undefined,
) {
  const leftTeam = left?.team || "";
  const rightTeam = right?.team || "";
  const teamDelta = leftTeam.localeCompare(rightTeam);
  if (teamDelta !== 0) return teamDelta;

  const leftName = left?.name || left?.id || "";
  const rightName = right?.name || right?.id || "";
  const nameDelta = leftName.localeCompare(rightName);
  if (nameDelta !== 0) return nameDelta;

  const leftId = left?.id || "";
  const rightId = right?.id || "";
  return leftId.localeCompare(rightId);
}

function sortDailyMilestonesByDate(
  left: { date: string; title: string; id: string },
  right: { date: string; title: string; id: string },
) {
  const dateDelta = new Date(left.date).getTime() - new Date(right.date).getTime();
  if (dateDelta !== 0) return dateDelta;

  const titleDelta = left.title.localeCompare(right.title);
  if (titleDelta !== 0) return titleDelta;

  return left.id.localeCompare(right.id);
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== "admin" && !auth.user.developerId) {
    return apiError("Developer account is not linked to a developer profile.", 403);
  }

  const store = await readStore();
  const developerById = new Map(
    store.developers.map((developer) => [developer.id, developer]),
  );
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

  const latestByDeveloperWeek = new Map<string, (typeof filtered)[number]>();
  for (const milestone of filtered) {
    const key = `${milestone.developerId}::${normalizeDate(milestone.weekStart) || milestone.weekStart}`;
    const current = latestByDeveloperWeek.get(key);
    if (!current) {
      latestByDeveloperWeek.set(key, milestone);
      continue;
    }

    if (new Date(milestone.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
      latestByDeveloperWeek.set(key, milestone);
    }
  }

  const items = Array.from(latestByDeveloperWeek.values())
    .sort((a, b) => {
      const weekDelta = new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      if (weekDelta !== 0) return weekDelta;

      return compareDevelopersForOrdering(
        developerById.get(a.developerId) || { id: a.developerId },
        developerById.get(b.developerId) || { id: b.developerId },
      );
    })
    .map((milestone) => {
      const dailyMilestones = [...(milestone.dailyMilestones || [])].sort(
        sortDailyMilestonesByDate,
      );
      return {
        ...milestone,
        dailyMilestones,
        stats: calculateMilestoneStats({
          ...milestone,
          dailyMilestones,
        }),
      };
    });

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
  const auth = await requireAuth(request);
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
