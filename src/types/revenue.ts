export interface GGRSummary {
  operatorId: string;
  operatorName: string;
  period: string;
  totalStakes: number;
  totalPayouts: number;
  totalRefunds: number;
  ggr: number;
  exemptions: number;
  taxableBase: number;
  taxRate: number;
  taxDue: number;
}

export interface RevenueTrendPoint {
  date: string;
  stakes: number;
  payouts: number;
  refunds: number;
  ggr: number;
}

export interface OperatorRevenue {
  operatorId: string;
  operatorName: string;
  trends: RevenueTrendPoint[];
  summary: GGRSummary;
}
