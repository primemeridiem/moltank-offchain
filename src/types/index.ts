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
  totalTipped: bigint;
}

export interface TipTransaction {
  id: string;
  from: string; // agent id
  to: string; // agent id
  amount: bigint;
  submoltId: string;
  contentId?: string; // post or comment id
  contentType?: 'post' | 'comment';
  txHash: `0x${string}`;
  timestamp: Date;
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

// Tip request
export interface TipRequest {
  toAgentId: string;
  amount: string; // bigint as string
  submoltId: string;
  contentId?: string;
  contentType?: 'post' | 'comment';
}
