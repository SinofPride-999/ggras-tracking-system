export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "create" | "update" | "delete" | "login" | "approve" | "reject" | "export";
  resourceType: "rule" | "user" | "operator" | "compliance_case" | "system";
  resourceId: string;
  description: string;
  ipAddress: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
