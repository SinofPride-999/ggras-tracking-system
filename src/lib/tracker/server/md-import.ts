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
const DAY_MS = 24 * 60 * 60 * 1000;
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
  monday: 0,
  tue: 1,
  tues: 1,
  tuesday: 1,
  wed: 2,
  weds: 2,
  wednesday: 2,
  thu: 3,
  thur: 3,
  thurs: 3,
  thursday: 3,
  fri: 4,
  friday: 4,
  sat: 5,
  saturday: 5,
  sun: 6,
  sunday: 6,
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

interface ParsedTask {
  title: string;
  priority?: string;
  duration?: string;
  deliverable?: string;
}

interface CheckpointDraft {
  date: string;
  title: string;
  estimatedHours: number;
  notes: string;
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
  return new Date(base.getTime() + offset * DAY_MS);
}

function normalizeText(input: string) {
  return input
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTableSeparatorRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return false;
  return /^(\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed);
}

function splitTableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => normalizeText(cell));
}

function parseDurationHours(duration: string, fallback = 2) {
  const raw = normalizeText(duration).toLowerCase();
  if (!raw) return fallback;

  const rangeMatch = raw.match(
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?:\s*)(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?/,
  );
  if (rangeMatch) {
    const left = Number(rangeMatch[1]);
    const right = Number(rangeMatch[2]);
    const unit = rangeMatch[3] || "h";
    const value = Math.max(left, right);
    if (/^m/.test(unit)) {
      return clampNumber(value / 60, 0.25, 24, fallback);
    }
    return clampNumber(value, 0.25, 24, fallback);
  }

  const singleMatch = raw.match(
    /(\d+(?:\.\d+)?)(?:\s*)(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/,
  );
  if (singleMatch) {
    const value = Number(singleMatch[1]);
    const unit = singleMatch[2];
    if (/^m/.test(unit)) {
      return clampNumber(value / 60, 0.25, 24, fallback);
    }
    return clampNumber(value, 0.25, 24, fallback);
  }

  const plainNumber = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isNaN(plainNumber) && plainNumber > 0) {
    return clampNumber(plainNumber, 0.25, 24, fallback);
  }

  return fallback;
}

function parseTaskTables(lines: string[]) {
  const parsed: ParsedTask[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    const next = lines[index + 1]?.trim() || "";
    if (!line.startsWith("|") || !isTableSeparatorRow(next)) {
      index += 1;
      continue;
    }

    const headers = splitTableCells(line).map((cell) => cell.toLowerCase());
    const taskCol = headers.findIndex((header) => header.includes("task"));
    if (taskCol === -1) {
      index += 1;
      continue;
    }
    const priorityCol = headers.findIndex((header) => header.includes("priority"));
    const durationCol = headers.findIndex((header) => header.includes("duration"));
    const deliverableCol = headers.findIndex((header) => header.includes("deliverable"));

    index += 2;
    while (index < lines.length) {
      const row = lines[index].trim();
      if (!row.startsWith("|")) break;
      if (isTableSeparatorRow(row)) {
        index += 1;
        continue;
      }

      const cells = splitTableCells(row);
      const title = normalizeText(cells[taskCol] || "");
      if (title && !/^-+$/.test(title)) {
        parsed.push({
          title,
          priority: normalizeText(cells[priorityCol] || ""),
          duration: normalizeText(cells[durationCol] || ""),
          deliverable: normalizeText(cells[deliverableCol] || ""),
        });
      }
      index += 1;
    }
  }

  return parsed;
}

function parseBulletTasks(lines: string[]) {
  const parsed: ParsedTask[] = [];
  for (const line of lines) {
    const trimmed = line.trim();

    const checklist = trimmed.match(/^[-*]\s+\[[ xX]\]\s*(.+)$/);
    if (checklist) {
      const title = normalizeText(checklist[1]);
      if (title && !/^day\s+\d+\s*:/i.test(title)) {
        parsed.push({ title });
      }
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      const title = normalizeText(bullet[1]);
      if (title && !/^day\s+\d+\s*:/i.test(title)) {
        parsed.push({ title });
      }
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      const title = normalizeText(numbered[1]);
      if (title) {
        parsed.push({ title });
      }
    }
  }

  return parsed;
}

function extractDailySectionLines(lines: string[]) {
  const index = lines.findIndex((line) =>
    /daily breakdown|daily milestones/i.test(normalizeText(line)),
  );
  if (index === -1) return lines;
  return lines.slice(index + 1);
}

function dayOffsetFromMarker(dayNumber: number, weekdayHint: string, fallbackOffset: number) {
  const normalizedDay = normalizeText(weekdayHint).toLowerCase();
  const exact = WEEKDAY_INDEX[normalizedDay];
  const short = WEEKDAY_INDEX[normalizedDay.slice(0, 3)];
  if (exact !== undefined) return exact;
  if (short !== undefined) return short;
  if (dayNumber > 0) return clampNumber((dayNumber - 1) % 7, 0, 6, fallbackOffset);
  return fallbackOffset;
}

function buildCheckpointNotes(task: ParsedTask) {
  const notes: string[] = [];
  if (task.priority) notes.push(`Priority: ${task.priority}`);
  if (task.duration) notes.push(`Duration: ${task.duration}`);
  if (task.deliverable) notes.push(`Deliverable: ${task.deliverable}`);
  return notes.join(" | ");
}

function addTaskDrafts(
  drafts: CheckpointDraft[],
  tasks: ParsedTask[],
  weekStart: Date,
  dayOffset: number,
) {
  const date = new Date(weekStart.getTime() + clampNumber(dayOffset, 0, 6, 0) * DAY_MS)
    .toISOString()
    .slice(0, 10);

  for (const task of tasks) {
    const title = normalizeText(task.title);
    if (!title) continue;
    drafts.push({
      date,
      title,
      estimatedHours: parseDurationHours(task.duration || "", 2),
      notes: buildCheckpointNotes(task),
    });
  }
}

function dedupeDrafts(drafts: CheckpointDraft[]) {
  const seen = new Set<string>();
  const output: CheckpointDraft[] = [];
  for (const draft of drafts) {
    const key = `${draft.date}::${draft.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(draft);
  }
  return output;
}

function parseSectionCheckpoints(lines: string[], weekStart: Date) {
  const scoped = extractDailySectionLines(lines);
  const drafts: CheckpointDraft[] = [];
  const markers: Array<{
    index: number;
    dayNumber: number;
    weekdayHint: string;
    inlineTask?: string;
  }> = [];
  let inCodeBlock = false;

  for (let index = 0; index < scoped.length; index += 1) {
    const line = scoped[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const dayHeading = trimmed.match(/^#{1,6}\s*day\s+(\d+)(?:\s*\(([^)]+)\))?/i);
    if (dayHeading) {
      markers.push({
        index,
        dayNumber: Number(dayHeading[1]),
        weekdayHint: normalizeText(dayHeading[2] || ""),
      });
      continue;
    }

    const inlineDay = trimmed.match(/^[-*]?\s*day\s+(\d+)\s*:\s*(.+)$/i);
    if (inlineDay) {
      markers.push({
        index,
        dayNumber: Number(inlineDay[1]),
        weekdayHint: "",
        inlineTask: normalizeText(inlineDay[2]),
      });
    }
  }

  let fallbackOffset = 0;
  if (markers.length > 0) {
    for (let markerIndex = 0; markerIndex < markers.length; markerIndex += 1) {
      const marker = markers[markerIndex];
      const nextMarkerIndex =
        markerIndex + 1 < markers.length ? markers[markerIndex + 1].index : scoped.length;
      const dayOffset = dayOffsetFromMarker(
        marker.dayNumber,
        marker.weekdayHint,
        fallbackOffset,
      );

      if (marker.inlineTask) {
        addTaskDrafts(
          drafts,
          [{ title: marker.inlineTask }],
          weekStart,
          dayOffset,
        );
        fallbackOffset = clampNumber(dayOffset + 1, 0, 6, dayOffset);
        continue;
      }

      const blockLines = scoped.slice(marker.index + 1, nextMarkerIndex);
      const tableTasks = parseTaskTables(blockLines);
      const tasks = tableTasks.length > 0 ? tableTasks : parseBulletTasks(blockLines);
      addTaskDrafts(drafts, tasks, weekStart, dayOffset);
      fallbackOffset = clampNumber(dayOffset + 1, 0, 6, dayOffset);
    }
  } else {
    const tableTasks = parseTaskTables(scoped);
    if (tableTasks.length > 0) {
      for (let index = 0; index < tableTasks.length; index += 1) {
        addTaskDrafts(drafts, [tableTasks[index]], weekStart, index % 7);
      }
    } else {
      const bullets = parseBulletTasks(scoped);
      for (let index = 0; index < bullets.length; index += 1) {
        addTaskDrafts(drafts, [bullets[index]], weekStart, index % 7);
      }
    }
  }

  return dedupeDrafts(drafts);
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
  const weeklyMilestoneIndex = section.body.findIndex((line) =>
    /weekly milestone/i.test(normalizeText(line)),
  );
  const weeklyItems: string[] = [];
  if (weeklyMilestoneIndex !== -1) {
    for (let index = weeklyMilestoneIndex + 1; index < section.body.length; index += 1) {
      const line = section.body[index].trim();
      if (!line) {
        if (weeklyItems.length > 0) continue;
        continue;
      }
      if (/daily breakdown|daily milestones/i.test(normalizeText(line))) break;
      if (/^#{1,6}\s+/.test(line)) break;

      const checklist = line.match(/^[-*]\s+\[[ xX]\]\s*(.+)$/);
      if (checklist) {
        weeklyItems.push(normalizeText(checklist[1]));
        continue;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        weeklyItems.push(normalizeText(bullet[1]));
      }
    }
  }

  const heading = normalizeText(section.heading);
  if (heading && weeklyItems.length > 0) {
    return `${heading} :: ${weeklyItems.join(" | ")}`;
  }
  if (heading) return heading;
  const firstContentLine = section.body.find((line) => line.trim().length > 0);
  if (firstContentLine) return normalizeText(firstContentLine);
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
    const sectionsByWeek = new Map<
      number,
      {
        goals: string[];
        checkpoints: CheckpointDraft[];
      }
    >();

    for (const section of sections) {
      const weekStartDate = getWeekStart(normalizedBaseWeek, section.weekNumber);
      const weekData = sectionsByWeek.get(section.weekNumber) || {
        goals: [],
        checkpoints: [],
      };
      weekData.goals.push(getWeeklyGoal(section));
      weekData.checkpoints.push(...parseSectionCheckpoints(section.body, weekStartDate));
      sectionsByWeek.set(section.weekNumber, weekData);
    }

    for (const [weekNumber, weekData] of Array.from(sectionsByWeek.entries()).sort(
      (a, b) => a[0] - b[0],
    )) {
      const weekStartDate = getWeekStart(normalizedBaseWeek, weekNumber);
      const weekStart = weekStartDate.toISOString().slice(0, 10);
      const weekEnd = new Date(weekStartDate.getTime() + 6 * DAY_MS).toISOString().slice(0, 10);
      const mergedGoal = Array.from(
        new Set(weekData.goals.map((goal) => normalizeText(goal)).filter(Boolean)),
      ).join(" || ");
      const sourcePlan = fileName;
      const now = new Date().toISOString();

      const checkpoints = dedupeDrafts(
        weekData.checkpoints.sort((a, b) => {
          const tsDelta = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (tsDelta !== 0) return tsDelta;
          return a.title.localeCompare(b.title);
        }),
      ).map((draft) => ({
        id: nextId("daily"),
        date: draft.date,
        title: draft.title,
        status: "pending",
        completionRate: 0,
        estimatedHours: clampNumber(draft.estimatedHours, 0.25, 24, 2),
        notes: draft.notes,
        updatedAt: now,
      })) satisfies DailyMilestone[];

      const existing =
        getMilestoneByPlanWeek(store, developerId, sourcePlan, weekNumber) ||
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
          weekNumber,
          sourcePlan,
          weeklyGoal: mergedGoal || `Week ${weekNumber} implementation milestones`,
          targetCompletionRate: 85,
          dailyMilestones: checkpoints,
          createdAt: now,
          updatedAt: now,
        };
        store.milestones.push(milestone);
        summary.milestonesCreated += 1;
        summary.checkpointsCreated += checkpoints.length;
      } else {
        existing.weekStart = weekStart;
        existing.weekEnd = weekEnd;
        existing.weekNumber = weekNumber;
        existing.sourcePlan = sourcePlan;
        existing.weeklyGoal = mergedGoal || existing.weeklyGoal;
        existing.dailyMilestones = checkpoints;
        existing.updatedAt = now;
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
