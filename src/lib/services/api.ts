// API Types for Sovereign Submolts

export type SovereignSubmolt = {
  submoltId: string;
  name: string;
  description: string;
  tokenName: string;
  tokenSymbol: string;
  earlyAccessKarma: number;
  gatedChannelKarma: number;
  creatorAllocation: number;
  creatorAgentId: string;
  treasuryAddress: string;
  tokenAddress: string;
  tokenSupply: string;
  createdAt: Date;
  tokenDeployed: boolean;
};

export type AccessInfo = {
  agentId: string;
  karma: number;
  canCreate: boolean;
  hasEarlyAccess: boolean;
  hasGatedChannelAccess: boolean;
  isCreator: boolean;
};

export type Stats = {
  totalSubmolts: number;
  totalAgents: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
