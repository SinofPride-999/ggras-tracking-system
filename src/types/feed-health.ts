export interface FeedHealth {
  operatorId: string;
  operatorName: string;
  status: "live" | "delayed" | "offline";
  lastEventTime: string;
  eventsPerMinute: number;
  latencyMs: number;
  uptimePercent: number;
  sequenceGaps: number;
}
