// Sovereign Submolt Types

export interface MoltbookAgent {
  id: string;
  name: string;
  karma: number;
  avatar?: string;
  claimed: boolean;
  followerCount: number;
  postCount: number;
  commentCount: number;
}

export interface Submolt {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberCount: number;
  createdAt: Date;
}

export interface SovereignSubmoltConfig {
  submoltId: string;
  tokenName: string;
  tokenSymbol: string;
  earlyAccessKarma: number;
  gatedChannelKarma: number;
  creatorAllocation: number; // percentage (0-100)
}

export interface SovereignSubmolt extends Submolt {
  config: SovereignSubmoltConfig;
  treasuryAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  isActive: boolean;
}

export interface GovernanceProposal {
  id: string;
  submoltId: string;
  title: string;
  description: string;
  proposerAgentId: string;
  createdAt: Date;
  endsAt: Date;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  forVotes: bigint;
  againstVotes: bigint;
  actions: ProposalAction[];
}

export interface ProposalAction {
  type: 'transfer' | 'config_change';
  target?: `0x${string}`;
  value?: bigint;
  data?: string;
}

export interface WhitelistEntry {
  agentId: string;
  karma: number;
  tier: 'creator' | 'early_access' | 'gated_channel';
  grantedAt: Date;
}

// Agent Wallet Types (self-custodial — only address stored server-side)
export interface AgentWallet {
  agentId: string;
  address: string;
  createdAt: Date;
}

export interface WalletInfo {
  address: string;
  balance: string;
}

// Token Launch Types
export interface TokenLaunch {
  id: number;
  submoltId: string | null;
  agentId: string;
  tokenAddress: string | null;
  salt: string | null;
  metadataUri: string | null;
  imageUri: string | null;
  status: 'pending' | 'deployed' | 'failed';
  txHash: string | null;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create Sovereign Submolt request
export interface CreateSovereignSubmoltRequest {
  submoltId: string;
  tokenName: string;
  tokenSymbol: string;
  earlyAccessKarma?: number;
  gatedChannelKarma?: number;
  creatorAllocation?: number;
}
