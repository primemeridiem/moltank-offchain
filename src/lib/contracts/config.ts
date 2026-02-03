// Contract Configuration for Monad Network
import { defineChain } from 'viem';

// Monad Testnet Configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// Contract Addresses (to be deployed)
export const CONTRACT_ADDRESSES = {
  // Factory contract for creating Moltlayer
  SOVEREIGN_SUBMOLT_FACTORY: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Governance implementation
  GOVERNANCE_IMPL: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Treasury implementation
  TREASURY_IMPL: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Token implementation
  TOKEN_IMPL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;

// Default configuration for new Moltlayer
export const DEFAULT_CONFIG = {
  // Minimum karma to create a Sovereign Submolt
  MIN_KARMA_TO_CREATE: 10,

  // Default karma thresholds (can be overridden by creator)
  DEFAULT_EARLY_ACCESS_KARMA: 50,
  DEFAULT_GATED_CHANNEL_KARMA: 25,

  // Max creator allocation (percentage)
  MAX_CREATOR_ALLOCATION: 20,

  // Default creator allocation
  DEFAULT_CREATOR_ALLOCATION: 10,

  // Governance settings
  VOTING_PERIOD: 3 * 24 * 60 * 60, // 3 days in seconds
  VOTING_DELAY: 1 * 24 * 60 * 60, // 1 day delay before voting starts
  PROPOSAL_THRESHOLD: 1, // 1% of total supply needed to propose
  QUORUM: 4, // 4% quorum
} as const;
