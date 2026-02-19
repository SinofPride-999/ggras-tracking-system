export type TrackerUserRole = "admin" | "developer";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type MilestoneStatus = "pending" | "in_progress" | "done" | "blocked";
export type SnapshotStatus = "not_started" | "watch" | "on_track" | "at_risk";

export interface TrackerUser {
  id: string;
  name: string;
  email: string;
  role: TrackerUserRole;
  developerId: string | null;
  status?: "invited" | "active" | "disabled";
}

export interface TrackerDeveloper {
  id: string;
  name: string;
  role: string;
  team: string;
  capacityPerWeek: number;
  salaryMonthly?: number;
  assignedUserId?: string | null;
  assignedEmail?: string | null;
}

export interface DailyMilestone {
  id: string;
  date: string;
  title: string;
  status: MilestoneStatus;
  completionRate: number;
  estimatedHours: number;
  notes?: string;
  updatedAt?: string;
}

export interface MilestoneStats {
  totalItems: number;
  doneItems: number;
  inProgressItems: number;
  blockedItems: number;
  pendingItems: number;
  progressRate: number;
  averageCompletionRate: number;
  estimatedHours: number;
}

export interface Milestone {
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
  stats: MilestoneStats;
}

export interface ProgressReport {
  id: string;
  developerId: string;
  reportDate: string;
  summary: string;
  achievements: string[];
  blockers: string[];
  plannedNext: string;
  hoursWorked: number;
  completionRate: number;
  riskLevel: RiskLevel;
  createdBy: string;
  createdAt: string;
}

export interface DeveloperSnapshot {
  developerId: string;
  developerName: string;
  role: string;
  team: string;
  weekStart: string;
  weekEnd: string | null;
  weeklyGoal: string | null;
  targetCompletionRate: number;
  progressRate: number;
  status: SnapshotStatus;
  blockedItems: number;
  pendingItems: number;
  doneItems: number;
  totalItems: number;
  estimatedHours: number;
  capacityPerWeek: number;
  latestReport: ProgressReport | null;
  reportsCount: number;
  avgReportedCompletion: number | null;
}

export interface AdminOverview {
  weekStart: string;
  weekEnd: string | null;
  project: TrackerProjectState;
  summary: {
    developerCount: number;
    averageProgressRate: number;
    onTrackCount: number;
    atRiskCount: number;
    reportsSubmitted: number;
  };
  riskDistribution: Record<SnapshotStatus, number>;
  topBlockers: Array<{ label: string; count: number }>;
  dailyTrend: Array<{ date: string; averageCompletionRate: number }>;
  developerSnapshots: DeveloperSnapshot[];
  recentReports: ProgressReport[];
}

export interface LoginResponse {
  token?: string;
  user?: TrackerUser;
  requiresSetup?: boolean;
  setupRequired?: boolean;
  message?: string;
}

export interface SetupPasswordPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface InviteDeveloperPayload {
  email: string;
  name: string;
  salaryMonthly?: number;
  role?: "developer";
  developerId?: string;
}

export interface TrackerProjectState {
  status: "not_started" | "active" | "completed";
  startDate: string | null;
  startedAt: string | null;
  startedBy: string | null;
  totalWeeks: number;
}

export interface ProgressReportPayload {
  developerId: string;
  reportDate: string;
  summary: string;
  achievements: string[];
  blockers: string[];
  plannedNext: string;
  hoursWorked: number;
  completionRate: number;
  riskLevel: RiskLevel;
}
