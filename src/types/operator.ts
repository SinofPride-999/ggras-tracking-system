export interface Operator {
  id: string;
  name: string;
  licenseNumber: string;
  gameTypes: string[];
  status: "active" | "suspended" | "inactive";
  feedStatus: "live" | "delayed" | "offline";
  registeredDate: string;
  contactEmail: string;
}
