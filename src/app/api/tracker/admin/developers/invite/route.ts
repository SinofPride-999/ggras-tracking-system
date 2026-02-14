import crypto from "crypto";
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
  role?: "admin" | "developer";
  developerId?: string;
  salaryMonthly?: number;
}

function hashSetupToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user: TrackerStoreUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    developerId: user.developerId || null,
    status: user.status || "invited",
  };
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
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
  const name = ensureString(body.name);
  const role = body.role === "admin" ? "admin" : "developer";
  const requestedDeveloperId = ensureString(body.developerId);
  const salaryMonthly =
    body.salaryMonthly !== undefined ? Number(body.salaryMonthly) : Number.NaN;

  if (!email || !name) {
    return apiError("email and name are required.", 400);
  }

  const store = await readStore();
  const existingByEmail = store.users.find(
    (candidate) => candidate.email.toLowerCase() === email,
  );
  if (existingByEmail) {
    return apiError("A user already exists with this email.", 409);
  }

  let developerId = requestedDeveloperId;
  if (role === "developer") {
    if (!Number.isFinite(salaryMonthly) || salaryMonthly <= 0) {
      return apiError("salaryMonthly is required and must be greater than 0.", 400);
    }

    if (!developerId) {
      developerId = `dev-${store.developers.length + 1}`;
      store.developers.push({
        id: developerId,
        name,
        role: "Developer",
        team: "Engineering",
        capacityPerWeek: 40,
        salaryMonthly,
      });
    } else {
      const existingDeveloper = store.developers.find(
        (developer) => developer.id === developerId,
      );
      if (!existingDeveloper) {
        store.developers.push({
          id: developerId,
          name,
          role: "Developer",
          team: "Engineering",
          capacityPerWeek: 40,
          salaryMonthly,
        });
      } else {
        existingDeveloper.name = name;
        existingDeveloper.salaryMonthly = salaryMonthly;
      }
    }
  } else {
    developerId = "";
  }

  const setupToken = crypto.randomBytes(20).toString("hex");
  const setupTokenHash = hashSetupToken(setupToken);
  const setupTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const user: TrackerStoreUser = {
    id: nextId("usr"),
    name,
    email,
    role,
    developerId: developerId || undefined,
    passwordSet: false,
    status: "invited",
    setupTokenHash,
    setupTokenExpiresAt,
  };

  store.users.push(user);
  await writeStore(store);

  return apiSuccess(
    {
      item: sanitizeUser(user),
      setupToken,
      setupTokenExpiresAt,
    },
    201,
  );
}
