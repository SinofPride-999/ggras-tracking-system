export interface GamingEvent {
  eventId: string;
  operatorId: string;
  eventType: "stake" | "payout" | "refund";
  amount: number;
  currency: "GHS";
  playerId: string;
  gameType: string;
  timestamp: string;
  sequenceNumber: number;
  signature?: string;
}
