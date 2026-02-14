import { promises as fs } from "fs";
import path from "path";
import type { DailyMilestone } from "@/types/tracker";
import {
  clampNumber,
  getProjectState,
  nextId,
  normalizeDate,
  type StoredMilestone,
  type TrackerStore,
} from "./store";

const DEFAULT_PLANS_DIR = path.join(process.cwd(), "plans");
const SOURCE_ROOT = path.resolve(process.cwd(), "..");
const PLAN_FILENAMES = [
  "DEV_PLAN_AI1.md",
  "DEV_PLAN_AI2.md",
  "DEV_PLAN_BE1.md",
  "DEV_PLAN_FE1.md",
  "DEV_PLAN_FE2.md",
  "DEV_PLAN_LEAD.md",
];

const WEEKDAY_INDEX: Record<string, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

interface PlanProfile {
  key: string;
  developerId: string;
  name: string;
  role: string;
  team: string;
  capacityPerWeek: number;
  salaryMonthly?: number;
}

const PLAN_PROFILE_MAP: Record<string, PlanProfile> = {
  DEV_PLAN_FE1: {
    key: "DEV_PLAN_FE1",
    developerId: "dev-fe1",
    name: "Frontend Developer 1",
    role: "Frontend Engineer",
    team: "Frontend",
    capacityPerWeek: 40,
  },
  DEV_PLAN_FE2: {
    key: "DEV_PLAN_FE2",
    developerId: "dev-fe2",
    name: "Frontend Developer 2",
    role: "Frontend Engineer",
    team: "Frontend",
    capacityPerWeek: 40,
  },
  DEV_PLAN_BE1: {
    key: "DEV_PLAN_BE1",
    developerId: "dev-be1",
    name: "Backend Developer 1",
    role: "Backend Engineer",
    team: "Backend",
    capacityPerWeek: 42,
  },
  DEV_PLAN_AI1: {
    key: "DEV_PLAN_AI1",
    developerId: "dev-ai1",
    name: "AI Developer 1",
    role: "ML Engineer",
    team: "AI",
    capacityPerWeek: 40,
  },
  DEV_PLAN_AI2: {
    key: "DEV_PLAN_AI2",
    developerId: "dev-ai2",
    name: "AI Developer 2",
    role: "ML Engineer",
    team: "AI",
    capacityPerWeek: 40,
  },
  DEV_PLAN_LEAD: {
    key: "DEV_PLAN_LEAD",
    developerId: "dev-lead",
    name: "Lead Engineer",
    role: "Lead Engineer",
    team: "Platform",
    capacityPerWeek: 45,
  },
};

interface WeekSection {
  weekNumber: number;
  heading: string;
  body: string[];
}

export interface ImportSummary {
  filesProcessed: number;
  milestonesCreated: number;
  milestonesUpdated: number;
  checkpointsCreated: number;
  checkpointsUpdated: number;
  warnings: string[];
}

export interface ImportMilestonesOptions {
  baseWeekStart?: string;
  plansDir?: string;
  planFiles?: string[];
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveDefaultPlanFiles() {
  const resolved: string[] = [];

  for (const fileName of PLAN_FILENAMES) {
    const candidates = [
      path.join(SOURCE_ROOT, fileName),
      path.join(process.cwd(), fileName),
      path.join(DEFAULT_PLANS_DIR, fileName),
    ];

    let selected: string | null = null;
    for (const candidate of candidates) {
      if (await pathExists(candidate)) {
        selected = candidate;
        break;
      }
    }
    if (selected) {
      resolved.push(selected);
    }
  }

  return resolved;
}

async function resolvePlanFiles(options: ImportMilestonesOptions) {
  if (Array.isArray(options.planFiles) && options.planFiles.length > 0) {
    return options.planFiles;
  }

  const defaults = await resolveDefaultPlanFiles();
  if (defaults.length > 0) return defaults;

  const plansDir = options.plansDir || DEFAULT_PLANS_DIR;
  try {
    const entries = await fs.readdir(plansDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      .map((entry) => path.join(plansDir, entry.name));
  } catch {
    return [];
  }
}

function parseWeekSections(lines: string[]) {
  const sections: WeekSection[] = [];
  let current: WeekSection | null = null;

  for (const line of lines) {
    const match = line.match(/^#{2,6}\s*WEEK\s+(\d+)\s*:?[\s-]*(.*)$/i);
    if (match) {
      if (current) sections.push(current);
      current = {
        weekNumber: Number(match[1]),
        heading: (match[2] || "").trim(),
        body: [],
      };
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  if (current) sections.push(current);
  if (sections.length > 0) return sections;

  return [
    {
      weekNumber: 1,
      heading: "Imported from markdown plan",
      body: lines,
    },
  ];
}

function getWeekStart(baseWeekStart: string, weekNumber: number) {
  const base = new Date(baseWeekStart);
  const offset = Math.max(0, weekNumber - 1) * 7;
  return new Date(base.getTime() + offset * 24 * 60 * 60 * 1000);
}

function buildDate(baseWeekStart: Date, dayName: string, fallbackOffset: number) {
  const key = dayName.toLowerCase().slice(0, 3);
  const index = WEEKDAY_INDEX[key];
  const offset = index !== undefined ? index : fallbackOffset;
  return new Date(baseWeekStart.getTime() + offset * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function parseDailyMilestones(lines: string[], weekStart: Date) {
  const checkpoints: DailyMilestone[] = [];
  let tableHit = false;

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
    if (cells.length < 2) continue;

    const day = cells[0];
    const task = cells[1];
    if (!/^(mon|tue|wed|thu|fri|sat|sun)/i.test(day)) continue;
    if (/^-+$/.test(task)) continue;
    tableHit = true;

    checkpoints.push({
      id: nextId("daily"),
      date: buildDate(weekStart, day, checkpoints.length),
      title: task,
      status: "pending",
      completionRate: 0,
      estimatedHours: clampNumber(8, 0, 24, 8),
      notes: "",
      updatedAt: new Date().toISOString(),
    });
  }

  if (tableHit && checkpoints.length > 0) {
    return checkpoints;
  }

  for (const line of lines) {
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (!bullet) continue;
    const text = bullet[1].trim();
    if (!text || text.length < 4) continue;

    checkpoints.push({
      id: nextId("daily"),
      date: buildDate(weekStart, "", checkpoints.length),
      title: text,
      status: "pending",
      completionRate: 0,
      estimatedHours: clampNumber(6, 0, 24, 6),
      notes: "",
      updatedAt: new Date().toISOString(),
    });
    if (checkpoints.length >= 7) break;
  }

  return checkpoints;
}

function resolvePlanProfile(filePath: string) {
  const baseName = path.basename(filePath, path.extname(filePath)).toUpperCase();
  for (const key of Object.keys(PLAN_PROFILE_MAP)) {
    if (baseName.includes(key)) return PLAN_PROFILE_MAP[key];
  }
  return null;
}

function ensureDeveloperForProfile(store: TrackerStore, profile: PlanProfile) {
  const existing = store.developers.find((developer) => developer.id === profile.developerId);
  if (existing) {
    if (existing.salaryMonthly === undefined && profile.salaryMonthly !== undefined) {
      existing.salaryMonthly = profile.salaryMonthly;
    }
    return existing;
  }

  const developer = {
    id: profile.developerId,
    name: profile.name,
    role: profile.role,
    team: profile.team,
    capacityPerWeek: profile.capacityPerWeek,
    salaryMonthly: profile.salaryMonthly,
  };
  store.developers.push(developer);
  return developer;
}

function getWeeklyGoal(section: WeekSection) {
  if (section.heading) return section.heading;
  const firstContentLine = section.body.find((line) => line.trim().length > 0);
  if (firstContentLine) return firstContentLine.trim();
  return `Week ${section.weekNumber} implementation milestones`;
}

function getMilestoneByPlanWeek(
  store: TrackerStore,
  developerId: string,
  sourcePlan: string,
  weekNumber: number,
) {
  return store.milestones.find(
    (milestone) =>
      milestone.developerId === developerId &&
      milestone.sourcePlan === sourcePlan &&
      milestone.weekNumber === weekNumber,
  );
}

export async function importMilestonesFromMarkdown(
  store: TrackerStore,
  options: ImportMilestonesOptions = {},
) {
  const warnings: string[] = [];
  const summary: ImportSummary = {
    filesProcessed: 0,
    milestonesCreated: 0,
    milestonesUpdated: 0,
    checkpointsCreated: 0,
    checkpointsUpdated: 0,
    warnings,
  };

  const normalizedBaseWeek =
    normalizeDate(options.baseWeekStart) || new Date().toISOString().slice(0, 10);

  const files = await resolvePlanFiles(options);
  if (files.length === 0) {
    warnings.push("No markdown plan files found for import.");
    return summary;
  }

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const profile = resolvePlanProfile(filePath);

    let developerId = store.developers[0]?.id || "dev-1";
    if (profile) {
      const developer = ensureDeveloperForProfile(store, profile);
      developerId = developer.id;
    }

    let content = "";
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      warnings.push(`Could not read file ${fileName}.`);
      continue;
    }

    summary.filesProcessed += 1;
    const lines = content.split(/\r?\n/);
    const sections = parseWeekSections(lines);

    for (const section of sections) {
      const weekStartDate = getWeekStart(normalizedBaseWeek, section.weekNumber);
      const weekStart = weekStartDate.toISOString().slice(0, 10);
      const weekEnd = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const checkpoints = parseDailyMilestones(section.body, weekStartDate);
      const weeklyGoal = getWeeklyGoal(section);

      const sourcePlan = fileName;
      const existing =
        getMilestoneByPlanWeek(store, developerId, sourcePlan, section.weekNumber) ||
        store.milestones.find(
          (milestone) =>
            milestone.developerId === developerId &&
            milestone.weekStart === weekStart,
        );

      if (!existing) {
        const milestone: StoredMilestone = {
          id: nextId("milestone"),
          developerId,
          weekStart,
          weekEnd,
          weekNumber: section.weekNumber,
          sourcePlan,
          weeklyGoal,
          targetCompletionRate: 85,
          dailyMilestones: checkpoints,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.milestones.push(milestone);
        summary.milestonesCreated += 1;
        summary.checkpointsCreated += checkpoints.length;
      } else {
        existing.weekStart = weekStart;
        existing.weekEnd = weekEnd;
        existing.weekNumber = section.weekNumber;
        existing.sourcePlan = sourcePlan;
        existing.weeklyGoal = weeklyGoal;
        existing.dailyMilestones = checkpoints;
        existing.updatedAt = new Date().toISOString();
        summary.milestonesUpdated += 1;
        summary.checkpointsUpdated += checkpoints.length;
      }
    }
  }

  const project = getProjectState(store);
  const maxWeek = store.milestones.reduce((max, milestone) => {
    const week = clampNumber(milestone.weekNumber, 1, 999, 1);
    return Math.max(max, week);
  }, 0);
  store.project = {
    ...project,
    totalWeeks: maxWeek,
  };

  return summary;
}

