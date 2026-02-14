import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { requireAuth } from "@/lib/tracker/server/guards";
import {
  clampNumber,
  ensureString,
  ensureStringArray,
  getDefaultWeekStart,
  getWeekRange,
  nextId,
  normalizeDate,
  normalizeRiskLevel,
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
  const weekStart = weekStartParam || getDefaultWeekStart(store);
  const requestedDeveloperId = ensureString(url.searchParams.get("developerId"));

  let developerIdFilter = requestedDeveloperId;
  if (auth.user.role !== "admin") {
    developerIdFilter = auth.user.developerId || "";
  }

  const weekRange = getWeekRange(weekStart);

  const items = store.progressReports
    .filter((report) => {
      if (developerIdFilter && report.developerId !== developerIdFilter) {
        return false;
      }

      if (!weekRange) return true;

      const reportDate = normalizeDate(report.reportDate);
      if (!reportDate) return false;

      const reportTs = new Date(reportDate).getTime();
      const startTs = new Date(weekRange.weekStart).getTime();
      const endTs = new Date(weekRange.weekEnd).getTime();
      return reportTs >= startTs && reportTs <= endTs;
    })
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

  return apiSuccess({ items });
}

interface ProgressReportPayload {
  developerId?: string;
  reportDate?: string;
  summary?: string;
  achievements?: string[] | string;
  blockers?: string[] | string;
  plannedNext?: string;
  hoursWorked?: number;
  completionRate?: number;
  riskLevel?: string;
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.role !== "admin" && !auth.user.developerId) {
    return apiError("Developer account is not linked to a developer profile.", 403);
  }

  let body: ProgressReportPayload;
  try {
    body = (await request.json()) as ProgressReportPayload;
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const store = await readStore();

  let developerId = ensureString(body.developerId);
  if (auth.user.role !== "admin") {
    developerId = auth.user.developerId || "";
  }

  const reportDate = normalizeDate(body.reportDate) || new Date().toISOString().slice(0, 10);
  const summary = ensureString(body.summary);
  const plannedNext = ensureString(body.plannedNext);
  const hoursWorked = clampNumber(body.hoursWorked, 0, 24, 0);
  const completionRate = clampNumber(body.completionRate, 0, 100, 0);
  const riskLevel = normalizeRiskLevel(body.riskLevel);

  if (!developerId || !summary) {
    return apiError("developerId and summary are required for progress reports.", 400);
  }

  if (auth.user.role !== "admin" && developerId !== auth.user.developerId) {
    return apiError("Developers can only submit reports for themselves.", 403);
  }

  const developer = store.developers.find((candidate) => candidate.id === developerId);
  if (!developer) {
    return apiError("Developer not found.", 404);
  }

  const report = {
    id: nextId("report"),
    developerId,
    reportDate,
    summary,
    achievements: ensureStringArray(body.achievements),
    blockers: ensureStringArray(body.blockers),
    plannedNext,
    hoursWorked,
    completionRate,
    riskLevel,
    createdBy: auth.user.id,
    createdAt: new Date().toISOString(),
  };

  store.progressReports.push(report);
  await writeStore(store);

  return apiSuccess({ item: report }, 201);
}
