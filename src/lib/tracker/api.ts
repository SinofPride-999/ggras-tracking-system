import type {
  AdminOverview,
  DeveloperSnapshot,
  InviteDeveloperPayload,
  LoginResponse,
  Milestone,
  ProgressReport,
  ProgressReportPayload,
  SetupPasswordPayload,
  TrackerProjectState,
  TrackerDeveloper,
  TrackerUser,
} from "@/types/tracker";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TRACKER_API_URL || "/api/tracker";

interface ApiErrorBody {
  error?: string;
  [key: string]: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  details: ApiErrorBody;

  constructor(message: string, status: number, details: ApiErrorBody) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: ApiErrorBody = {};
    let message = `Request failed with status ${response.status}`;
    try {
      payload = (await response.json()) as ApiErrorBody;
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore parse failure and keep default message.
    }
    throw new ApiRequestError(message, response.status, payload);
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function setupPassword(payload: SetupPasswordPayload) {
  return request<LoginResponse>("/auth/setup-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function inviteDeveloper(token: string, payload: InviteDeveloperPayload) {
  return request<{
    item: TrackerUser;
    setupToken: string;
    setupTokenExpiresAt: string;
  }>(
    "/admin/developers/invite",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function importMdPlan(token: string, baseWeekStart?: string) {
  return request<{
    summary: {
      filesProcessed: number;
      milestonesCreated: number;
      milestonesUpdated: number;
      checkpointsCreated: number;
      checkpointsUpdated: number;
      warnings: string[];
    };
  }>(
    "/admin/import-md",
    {
      method: "POST",
      body: JSON.stringify({ baseWeekStart }),
    },
    token,
  );
}

export async function seedFromMdPlans(
  token: string,
  payload?: {
    baseWeekStart?: string;
    planFiles?: string[];
    clearDevelopers?: boolean;
  },
) {
  return request<{
    summary: {
      filesProcessed: number;
      milestonesCreated: number;
      milestonesUpdated: number;
      checkpointsCreated: number;
      checkpointsUpdated: number;
      warnings: string[];
    };
    project: TrackerProjectState;
  }>(
    "/admin/seed",
    {
      method: "POST",
      body: JSON.stringify(payload || {}),
    },
    token,
  );
}

export async function getProjectState(token: string) {
  return request<{ project: TrackerProjectState; milestones: number }>(
    "/admin/project",
    { method: "GET" },
    token,
  );
}

export async function startProject(token: string, startDate?: string) {
  return request<{ project: TrackerProjectState }>(
    "/admin/project",
    {
      method: "POST",
      body: JSON.stringify({ startDate }),
    },
    token,
  );
}

export async function getCurrentUser(token: string) {
  return request<{ user: TrackerUser }>("/auth/me", { method: "GET" }, token);
}

export async function getDevelopers(token: string) {
  return request<{ items: TrackerDeveloper[] }>("/developers", {}, token);
}

export async function getMilestones(token: string, weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return request<{ weekStart: string; project: TrackerProjectState; items: Milestone[] }>(
    `/milestones${query}`,
    {},
    token,
  );
}

export async function getAdminOverview(token: string, weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return request<AdminOverview>(`/admin/overview${query}`, {}, token);
}

export async function getDeveloperOverview(token: string, weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return request<{
    weekStart: string;
    project: TrackerProjectState;
    snapshot: DeveloperSnapshot;
  }>(
    `/developer/overview${query}`,
    {},
    token,
  );
}

export async function getProgressReports(token: string, weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return request<{ items: ProgressReport[] }>(`/progress-reports${query}`, {}, token);
}

export async function submitProgressReport(
  token: string,
  payload: ProgressReportPayload,
) {
  return request<{ item: ProgressReport }>(
    "/progress-reports",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateDailyMilestone(
  token: string,
  milestoneId: string,
  dailyId: string,
  payload: {
    status?: "pending" | "in_progress" | "done" | "blocked";
    completionRate?: number;
    notes?: string;
    title?: string;
    estimatedHours?: number;
  },
) {
  return request<{ item: Milestone }>(
    `/milestones/${encodeURIComponent(milestoneId)}/daily/${encodeURIComponent(dailyId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}
