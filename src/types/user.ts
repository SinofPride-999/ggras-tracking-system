export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "super_admin" | "admin" | "compliance_officer" | "analyst" | "viewer";
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
  permissions: string[];
}
