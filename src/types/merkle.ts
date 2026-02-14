export interface MerkleBatch {
  batchId: string;
  merkleRoot: string;
  eventCount: number;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  verified: boolean;
  leafHashes: string[];
}
