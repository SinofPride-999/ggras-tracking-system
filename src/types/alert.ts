export interface Alert {
  id: string;
  type: "under_reporting" | "payout_spike" | "feed_drop";
  severity: "low" | "medium" | "high" | "critical";
  operatorId: string;
  operatorName: string;
  title: string;
  description: string;
  timestamp: string;
  status: "new" | "acknowledged" | "resolved";
  affectedPeriod: { from: string; to: string };
  anomalyScore: number;
}
