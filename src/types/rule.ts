export interface TaxRule {
  id: string;
  name: string;
  description: string;
  gameType: string;
  taxRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  exemptions: Exemption[];
  status: "draft" | "pending_approval" | "approved" | "active" | "deprecated";
  versions: RuleVersion[];
  createdBy: string;
  createdAt: string;
}

export interface RuleVersion {
  version: string;
  changedAt: string;
  changedBy: string;
  changes: string;
  status: "draft" | "pending" | "approved" | "rejected";
  approvedBy?: string;
  comment?: string;
}

export interface Exemption {
  type: "operator" | "game_type" | "amount_threshold" | "time_period";
  description: string;
  value: string;
}
