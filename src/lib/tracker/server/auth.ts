import jwt from "jsonwebtoken";
import type { TrackerUserRole } from "@/types/tracker";
import type { TrackerStoreUser } from "./store";

const JWT_SECRET = process.env.JWT_SECRET || "ggras-dev-secret-change-me";
const JWT_TTL = process.env.JWT_TTL || "12h";

export interface AuthTokenUser {
  id: string;
  name: string;
  email: string;
  role: TrackerUserRole;
  developerId: string | null;
  status?: "invited" | "active" | "disabled";
}

export function sanitizeUser(user: TrackerStoreUser): AuthTokenUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    developerId: user.developerId || null,
    status: user.status || "active",
  };
}

export function createToken(user: TrackerStoreUser) {
  return jwt.sign(sanitizeUser(user), JWT_SECRET, {
    expiresIn: JWT_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function readBearerToken(request: Pick<Request, "headers">) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenUser;
  } catch {
    return null;
  }
}
