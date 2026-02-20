import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import {
  clampNumber,
  getProjectState,
  normalizeDate,
  readStore,
  writeStore,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

interface StartProjectPayload {
  startDate?: string;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const base = new Date(dateString);
  return toDateOnly(new Date(base.getTime() + days * DAY_MS));
}

function resolveProjectStartDate(store: Awaited<ReturnType<typeof readStore>>, requested?: string) {
  const normalizedRequested = normalizeDate(requested);
  if (normalizedRequested) {
    return normalizedRequested;
  }

  const earliestWeek = Array.from(
    new Set(store.milestones.map((milestone) => normalizeDate(milestone.weekStart) || "")),
  )
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  if (earliestWeek) return earliestWeek;
  return toDateOnly(new Date());
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  const store = await readStore();
  return apiSuccess({
    project: getProjectState(store),
    milestones: store.milestones.length,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  let body: StartProjectPayload = {};
  try {
    body = (await request.json()) as StartProjectPayload;
  } catch {
    // Empty payload is acceptable.
  }

  const store = await readStore();
  const project = getProjectState(store);
  const explicitStartDate = normalizeDate(body.startDate);
  if (project.status === "active" && !explicitStartDate) {
    return apiError("Project has already been started. Provide startDate to re-align dates.", 409);
  }

  if (store.milestones.length === 0) {
    return apiError(
      "No milestones found. Add milestone plans before starting the project.",
      400,
    );
  }

  const startDate = resolveProjectStartDate(store, explicitStartDate || undefined);
  const now = new Date().toISOString();

  const weekOrder = Array.from(
    new Set(store.milestones.map((milestone) => normalizeDate(milestone.weekStart) || "")),
  )
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const weekNumberByDate = new Map(
    weekOrder.map((weekStart, index) => [weekStart, index + 1]),
  );

  for (const milestone of store.milestones) {
    const oldWeekStart = normalizeDate(milestone.weekStart) || startDate;
    const weekNumber = clampNumber(
      milestone.weekNumber ?? weekNumberByDate.get(oldWeekStart) ?? 1,
      1,
      999,
      1,
    );
    const newWeekStart = addDays(startDate, (weekNumber - 1) * 7);
    const newWeekEnd = addDays(newWeekStart, 6);
    const oldWeekStartTs = new Date(oldWeekStart).getTime();

    milestone.weekNumber = weekNumber;
    milestone.weekStart = newWeekStart;
    milestone.weekEnd = newWeekEnd;
    milestone.updatedAt = now;

    milestone.dailyMilestones = (milestone.dailyMilestones || []).map((daily, index) => {
      const oldDailyDate = normalizeDate(daily.date);
      let dayOffset = index;
      if (oldDailyDate) {
        const delta = Math.round(
          (new Date(oldDailyDate).getTime() - oldWeekStartTs) / DAY_MS,
        );
        dayOffset = clampNumber(delta, 0, 6, index);
      }

      return {
        ...daily,
        date: addDays(newWeekStart, dayOffset),
        updatedAt: now,
      };
    });
  }

  const totalWeeks = store.milestones.reduce((max, milestone) => {
    const week = clampNumber(milestone.weekNumber, 1, 999, 1);
    return Math.max(max, week);
  }, 0);

  store.project =
    project.status === "active"
      ? {
          ...project,
          status: "active",
          startDate,
          totalWeeks,
        }
      : {
          status: "active",
          startDate,
          startedAt: now,
          startedBy: auth.user.id,
          totalWeeks,
        };

  await writeStore(store);

  return apiSuccess({
    project: store.project,
  });
}
