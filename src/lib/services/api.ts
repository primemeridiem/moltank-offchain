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

export type Tip = {
  id: string;
  from: string;
  to: string;
  amount: string;
  submoltId: string;
  contentId?: string;
  contentType?: 'post' | 'comment';
  timestamp: Date;
};

export type LeaderboardEntry = {
  agentId: string;
  received: string;
  given: string;
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
  totalTips: number;
  totalAgents: number;
  totalVolume: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
