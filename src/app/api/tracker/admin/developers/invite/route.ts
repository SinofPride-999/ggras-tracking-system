import { apiError, apiSuccess } from "@/lib/tracker/server/http";
import { ensureRole, requireAuth } from "@/lib/tracker/server/guards";
import {
  ensureString,
  nextId,
  readStore,
  type TrackerStoreUser,
  writeStore,
} from "@/lib/tracker/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InvitePayload {
  email?: string;
  name?: string;
  role?: "developer";
  developerId?: string;
  salaryMonthly?: number;
}

function sanitizeUser(user: TrackerStoreUser) {
  return {
    id: user.id,
    name: user.role === "admin" ? "" : user.name,
    email: user.email,
    role: user.role,
    developerId: user.developerId || null,
    status: user.status || "invited",
  };
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const roleError = ensureRole(auth.user, ["admin"]);
  if (roleError) return roleError;

  let body: InvitePayload;
  try {
    body = (await request.json()) as InvitePayload;
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const email = ensureString(body.email).toLowerCase();
  const role = "developer";
  const nameInput = ensureString(body.name);
  const name = nameInput;
  const requestedDeveloperId = ensureString(body.developerId);
  const salaryMonthly =
    body.salaryMonthly !== undefined ? Number(body.salaryMonthly) : Number.NaN;

  if (!email) {
    return apiError("email is required.", 400);
  }
  if (role === "developer" && !name) {
    return apiError("name is required for developer invites.", 400);
  }

  const store = await readStore();
  const existingByEmail = store.users.find(
    (candidate) => candidate.email.toLowerCase() === email,
  );
  if (existingByEmail) {
    return apiError("A user already exists with this email.", 409);
  }

  const developerId = requestedDeveloperId;
  if (!Number.isFinite(salaryMonthly) || salaryMonthly <= 0) {
    return apiError("salaryMonthly is required and must be greater than 0.", 400);
  }

  if (!developerId) {
    return apiError("developerId is required for developer invites.", 400);
  }

  const existingDeveloper = store.developers.find(
    (developer) => developer.id === developerId,
  );
  if (!existingDeveloper) {
    return apiError(
      "Selected developer profile does not exist. Add developer milestones first.",
      404,
    );
  }

  const existingUserByDeveloper = store.users.find(
    (candidate) =>
      candidate.role === "developer" &&
      candidate.developerId === developerId &&
      candidate.status !== "disabled",
  );
  if (existingUserByDeveloper) {
    return apiError("Selected developer already has an account.", 409);
  }

  existingDeveloper.name = name;
  existingDeveloper.salaryMonthly = salaryMonthly;

  const user: TrackerStoreUser = {
    id: nextId("usr"),
    name,
    email,
    role,
    developerId: developerId || undefined,
    passwordSet: false,
    status: "invited",
  };

  store.users.push(user);
  await writeStore(store);

  return apiSuccess(
    {
      item: sanitizeUser(user),
    },
    201,
  );
}
