import { promises as fs } from "fs";
import path from "path";
import seedStore from "./seed-store.json";
import { getMongoDb } from "./mongodb";
import type {
  AdminOverview,
  DailyMilestone,
  DeveloperSnapshot,
  MilestoneStats,
  MilestoneStatus,
  ProgressReport,
  RiskLevel,
  SnapshotStatus,
  TrackerDeveloper,
  TrackerProjectState,
  TrackerUserRole,
} from "@/types/tracker";

const DAY_MS = 24 * 60 * 60 * 1000;
const STORE_DOC_ID = "tracker-store-singleton";
const STORE_COLLECTION = "tracker_store";
const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "tracker-store.json");

const hasMongoConfig = Boolean(process.env.MONGODB_URI);

export const storeMode = hasMongoConfig ? "mongodb" : "local-file";
export const hasDurablePersistence = hasMongoConfig;

export interface TrackerStoreUser {
  id: string;
  name: string;
  email: string;
  role: TrackerUserRole;
  developerId?: string;
  passwordHash?: string;
  passwordSet?: boolean;
  status?: "invited" | "active" | "disabled";
}

export interface StoredMilestone {
  id: string;
  developerId: string;
  weekStart: string;
  weekEnd: string;
  weekNumber?: number;
  sourcePlan?: string;
  weeklyGoal: string;
  targetCompletionRate: number;
  dailyMilestones: DailyMilestone[];
  createdAt: string;
  updatedAt: string;
}

export type StoredProjectState = TrackerProjectState;

export interface TrackerStore {
  users: TrackerStoreUser[];
  developers: TrackerDeveloper[];
  milestones: StoredMilestone[];
  progressReports: ProgressReport[];
  project?: StoredProjectState;
}

interface TrackerStoreDocument extends TrackerStore {
  _id: string;
}

const dailyStatuses: MilestoneStatus[] = [
  "pending",
  "in_progress",
  "done",
  "blocked",
];
const riskLevels: RiskLevel[] = ["low", "medium", "high", "critical"];

export const DAILY_STATUSES: Set<MilestoneStatus> = new Set(dailyStatuses);
export const RISK_LEVELS: Set<RiskLevel> = new Set(riskLevels);

function defaultProjectState() {
  return {
    status: "not_started",
    startDate: null,
    startedAt: null,
    startedBy: null,
    totalWeeks: 0,
  } satisfies StoredProjectState;
}

function applyStoreDefaults(store: TrackerStore): TrackerStore {
  const next = store;
  next.users = (next.users || []).map((user) =>
    user.role === "admin"
      ? {
          ...user,
          name: "",
        }
      : user,
  );
  next.project = {
    ...defaultProjectState(),
    ...(store.project || {}),
  };
  return next;
}

function cloneSeedStore() {
  return applyStoreDefaults(JSON.parse(JSON.stringify(seedStore)) as TrackerStore);
}

async function ensureLocalStoreExists() {
  try {
    await fs.access(LOCAL_STORE_PATH);
  } catch {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await fs.writeFile(
      LOCAL_STORE_PATH,
      `${JSON.stringify(cloneSeedStore(), null, 2)}\n`,
      "utf8",
    );
  }
}

async function readLocalStore() {
  await ensureLocalStoreExists();
  const raw = await fs.readFile(LOCAL_STORE_PATH, "utf8");
  return applyStoreDefaults(JSON.parse(raw) as TrackerStore);
}

async function writeLocalStore(data: TrackerStore) {
  await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await fs.writeFile(LOCAL_STORE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function readStore() {
  if (!hasMongoConfig) {
    return readLocalStore();
  }

  const db = await getMongoDb();
  if (!db) {
    return readLocalStore();
  }

  const collection = db.collection<TrackerStoreDocument>(STORE_COLLECTION);
  const existing = await collection.findOne({
    _id: STORE_DOC_ID,
  });
  if (existing) {
    const { _id: ignoredId, ...store } = existing;
    void ignoredId;
    return applyStoreDefaults(store);
  }
  const seeded = cloneSeedStore();
  await collection.insertOne({
    _id: STORE_DOC_ID,
    ...seeded,
  });
  return seeded;
}

export async function writeStore(data: TrackerStore) {
  const payload = applyStoreDefaults(data);

  if (!hasMongoConfig) {
    await writeLocalStore(payload);
    return;
  }

  const db = await getMongoDb();
  if (!db) {
    await writeLocalStore(payload);
    return;
  }

  const collection = db.collection<TrackerStoreDocument>(STORE_COLLECTION);
  await collection.updateOne(
    { _id: STORE_DOC_ID },
    {
      $set: payload,
    },
    { upsert: true },
  );
}

export function nextId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

export function normalizeDate(input: unknown) {
  if (typeof input !== "string" || !input.trim()) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function getWeekRange(weekStartInput: string) {
  const weekStart = normalizeDate(weekStartInput);
  if (!weekStart) return null;

  const start = new Date(weekStart);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const dates = Array.from({ length: 7 }, (_, index) =>
    new Date(start.getTime() + index * DAY_MS).toISOString().slice(0, 10),
  );

  return {
    weekStart,
    weekEnd: end.toISOString().slice(0, 10),
    dates,
  };
}

export function getLatestWeekStart(store: TrackerStore) {
  const unique = Array.from(new Set(store.milestones.map((item) => item.weekStart)));
  unique.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return unique[0] || new Date().toISOString().slice(0, 10);
}

export function getEarliestWeekStart(store: TrackerStore) {
  const unique = Array.from(new Set(store.milestones.map((item) => item.weekStart)));
  unique.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return unique[0] || new Date().toISOString().slice(0, 10);
}

export function getDefaultWeekStart(store: TrackerStore, todayInput?: string) {
  const weekStarts = Array.from(new Set(store.milestones.map((item) => item.weekStart))).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  if (weekStarts.length === 0) {
    return new Date().toISOString().slice(0, 10);
  }

  const project = getProjectState(store);
  if (project.status !== "active") {
    return weekStarts[0];
  }

  const projectStart = normalizeDate(project.startDate);
  if (!projectStart) {
    return weekStarts[0];
  }

  const today = normalizeDate(todayInput) || new Date().toISOString().slice(0, 10);
  const deltaDays = Math.floor(
    (new Date(today).getTime() - new Date(projectStart).getTime()) / DAY_MS,
  );
  if (deltaDays <= 0) {
    return weekStarts[0];
  }

  const weekIndex = clampNumber(Math.floor(deltaDays / 7), 0, weekStarts.length - 1, 0);
  return weekStarts[weekIndex];
}

export function getProjectState(store: TrackerStore) {
  return {
    ...defaultProjectState(),
    ...(store.project || {}),
  } satisfies StoredProjectState;
}

export function clampNumber(value: unknown, min: number, max: number, fallback = min) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

export function ensureString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  return fallback;
}

export function ensureStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ensureString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

export function normalizeDailyStatus(value: unknown): MilestoneStatus {
  const normalized = ensureString(value).toLowerCase() as MilestoneStatus;
  return DAILY_STATUSES.has(normalized) ? normalized : "pending";
}

export function normalizeRiskLevel(value: unknown): RiskLevel {
  const normalized = ensureString(value).toLowerCase() as RiskLevel;
  return RISK_LEVELS.has(normalized) ? normalized : "medium";
}

export function calculateMilestoneStats(milestone: Pick<StoredMilestone, "dailyMilestones">) {
  const items = milestone.dailyMilestones || [];
  if (items.length === 0) {
    return {
      totalItems: 0,
      doneItems: 0,
      inProgressItems: 0,
      blockedItems: 0,
      pendingItems: 0,
      progressRate: 0,
      averageCompletionRate: 0,
      estimatedHours: 0,
    } satisfies MilestoneStats;
  }

  const doneItems = items.filter((item) => item.status === "done").length;
  const inProgressItems = items.filter((item) => item.status === "in_progress").length;
  const blockedItems = items.filter((item) => item.status === "blocked").length;
  const pendingItems = items.filter((item) => item.status === "pending").length;
  const completionTotal = items.reduce(
    (sum, item) => sum + clampNumber(item.completionRate, 0, 100, 0),
    0,
  );
  const averageCompletionRate = Math.round(completionTotal / items.length);
  const estimatedHours = items.reduce(
    (sum, item) => sum + clampNumber(item.estimatedHours, 0, 24, 0),
    0,
  );

  return {
    totalItems: items.length,
    doneItems,
    inProgressItems,
    blockedItems,
    pendingItems,
    progressRate: averageCompletionRate,
    averageCompletionRate,
    estimatedHours,
  } satisfies MilestoneStats;
}

function getReportsForDeveloperWeek(
  store: TrackerStore,
  developerId: string,
  weekStartInput: string,
) {
  const weekRange = getWeekRange(weekStartInput);
  if (!weekRange) return [] as ProgressReport[];

  const start = new Date(weekRange.weekStart).getTime();
  const end = new Date(weekRange.weekEnd).getTime();

  return store.progressReports
    .filter((report) => {
      if (report.developerId !== developerId) return false;
      const reportDate = normalizeDate(report.reportDate);
      if (!reportDate) return false;
      const ts = new Date(reportDate).getTime();
      return ts >= start && ts <= end;
    })
    .sort((a, b) => {
      const reportDateDelta = new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      if (reportDateDelta !== 0) return reportDateDelta;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

function deriveSnapshotStatus(
  milestoneExists: boolean,
  progressRate: number,
  blockedItems: number,
): SnapshotStatus {
  if (!milestoneExists) return "not_started";
  if (blockedItems > 0 || progressRate < 60) return "at_risk";
  if (progressRate >= 85) return "on_track";
  return "watch";
}

function compareDevelopersForDisplay(
  left: Pick<TrackerDeveloper, "id" | "name" | "team">,
  right: Pick<TrackerDeveloper, "id" | "name" | "team">,
) {
  const teamDelta = ensureString(left.team).localeCompare(ensureString(right.team));
  if (teamDelta !== 0) return teamDelta;

  const nameDelta = ensureString(left.name).localeCompare(ensureString(right.name));
  if (nameDelta !== 0) return nameDelta;

  return left.id.localeCompare(right.id);
}

export function buildDeveloperSnapshot(
  store: TrackerStore,
  developer: TrackerDeveloper,
  weekStartInput: string,
) {
  const weekStart = normalizeDate(weekStartInput) || getDefaultWeekStart(store);
  const normalizedWeekStart = normalizeDate(weekStart);
  const milestone = store.milestones
    .filter(
      (item) =>
        item.developerId === developer.id &&
        normalizeDate(item.weekStart) === normalizedWeekStart,
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const stats = calculateMilestoneStats({ dailyMilestones: milestone?.dailyMilestones || [] });
  const reports = getReportsForDeveloperWeek(store, developer.id, weekStart);
  const latestReport = reports[0] || null;
  const avgReportedCompletion = reports.length
    ? Math.round(
        reports.reduce((sum, report) => sum + clampNumber(report.completionRate, 0, 100, 0), 0) /
          reports.length,
      )
    : null;

  return {
    developerId: developer.id,
    developerName: developer.name,
    role: developer.role,
    team: developer.team,
    weekStart,
    weekEnd: milestone?.weekEnd || getWeekRange(weekStart)?.weekEnd || null,
    weeklyGoal: milestone?.weeklyGoal || null,
    targetCompletionRate: milestone?.targetCompletionRate ?? 100,
    progressRate: stats.progressRate,
    status: deriveSnapshotStatus(Boolean(milestone), stats.progressRate, stats.blockedItems),
    blockedItems: stats.blockedItems,
    pendingItems: stats.pendingItems,
    doneItems: stats.doneItems,
    totalItems: stats.totalItems,
    estimatedHours: stats.estimatedHours,
    capacityPerWeek: clampNumber(developer.capacityPerWeek, 0, 100, 40),
    latestReport,
    reportsCount: reports.length,
    avgReportedCompletion,
  } satisfies DeveloperSnapshot;
}

export function buildAdminOverview(store: TrackerStore, weekStartInput?: string) {
  const weekStart = normalizeDate(weekStartInput) || getDefaultWeekStart(store);
  const weekRange = getWeekRange(weekStart);
  const snapshots = [...store.developers]
    .sort(compareDevelopersForDisplay)
    .map((developer) => buildDeveloperSnapshot(store, developer, weekStart));

  const summary = {
    developerCount: store.developers.length,
    averageProgressRate: snapshots.length
      ? Math.round(
          snapshots.reduce((sum, snapshot) => sum + snapshot.progressRate, 0) /
            snapshots.length,
        )
      : 0,
    onTrackCount: snapshots.filter((snapshot) => snapshot.status === "on_track").length,
    atRiskCount: snapshots.filter((snapshot) => snapshot.status === "at_risk").length,
    reportsSubmitted: 0,
  };

  const riskDistribution: Record<SnapshotStatus, number> = {
    on_track: snapshots.filter((snapshot) => snapshot.status === "on_track").length,
    watch: snapshots.filter((snapshot) => snapshot.status === "watch").length,
    at_risk: snapshots.filter((snapshot) => snapshot.status === "at_risk").length,
    not_started: snapshots.filter((snapshot) => snapshot.status === "not_started").length,
  };

  const reportsThisWeek = store.progressReports
    .filter((report) => {
      if (!weekRange) return false;
      const date = normalizeDate(report.reportDate);
      if (!date) return false;
      const ts = new Date(date).getTime();
      const start = new Date(weekRange.weekStart).getTime();
      const end = new Date(weekRange.weekEnd).getTime();
      return ts >= start && ts <= end;
    })
    .sort((a, b) => {
      const reportDateDelta = new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      if (reportDateDelta !== 0) return reportDateDelta;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  summary.reportsSubmitted = reportsThisWeek.length;

  const blockerFrequency = new Map<string, number>();
  for (const report of reportsThisWeek) {
    for (const blocker of report.blockers || []) {
      const label = blocker.toLowerCase();
      blockerFrequency.set(label, (blockerFrequency.get(label) || 0) + 1);
    }
  }
  const topBlockers = Array.from(blockerFrequency.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const countDelta = b.count - a.count;
      if (countDelta !== 0) return countDelta;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 5);

  const dailyTrend = (weekRange?.dates || []).map((date) => {
    const entries = store.milestones
      .flatMap((milestone) => milestone.dailyMilestones)
      .filter((item) => normalizeDate(item.date) === date)
      .map((item) => clampNumber(item.completionRate, 0, 100, 0));

    return {
      date,
      averageCompletionRate: entries.length
        ? Math.round(entries.reduce((sum, value) => sum + value, 0) / entries.length)
        : 0,
    };
  });

  return {
    weekStart,
    weekEnd: weekRange?.weekEnd || null,
    project: getProjectState(store),
    summary,
    riskDistribution,
    topBlockers,
    dailyTrend,
    developerSnapshots: snapshots,
    recentReports: reportsThisWeek.slice(0, 12),
  } satisfies AdminOverview;
}
