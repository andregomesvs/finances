export interface PluggyConnection {
  itemId: string;
  userId: string;
  connectorId: number;
  institutionName: string;
  institutionImageUrl: string | null;
  status: string;
  executionStatus: string;
  lastUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
