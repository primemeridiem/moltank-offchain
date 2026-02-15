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
  // Factory contract for creating Moltank
  SOVEREIGN_SUBMOLT_FACTORY: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Governance implementation
  GOVERNANCE_IMPL: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Treasury implementation
  TREASURY_IMPL: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Token implementation
  TOKEN_IMPL: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;

// Nad.fun contract addresses on Monad
export const NADFUN_ADDRESSES = {
  BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22' as `0x${string}`,
  LENS: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea' as `0x${string}`,
} as const;

// BondingCurveRouter ABI (create function)
export const BONDING_CURVE_ROUTER_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'tokenURI', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    name: 'create',
    outputs: [{ name: 'token', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'minTokens', type: 'uint256' },
    ],
    name: 'buy',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'minEth', type: 'uint256' },
    ],
    name: 'sell',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// MoltTank Launchpad contract address (update after deployment)
export const MOLTTANK_ADDRESS = (process.env.NEXT_PUBLIC_MOLTTANK_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// MoltTank ABI (createLaunchWithPreset, contribute, launchToken, claim, getLaunch, getSplitDetails, getHardCap)
export const MOLTTANK_ABI = [
  {
    inputs: [
      { name: 'baseConfig', type: 'string[4]' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'contributionConfig', type: 'uint256[2]' },
      { name: 'timeConfig', type: 'uint256[2]' },
      { name: 'splitOption', type: 'uint8' },
      { name: 'treasuryCap', type: 'uint256' },
      { name: 'treasuryAddress', type: 'address' },
      { name: 'preset', type: 'uint8' },
    ],
    name: 'createLaunchWithPreset',
    outputs: [{ name: 'launchId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'config',
        type: 'tuple',
        components: [
          { name: 'tankId', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'tokenURI', type: 'string' },
          { name: 'merkleRoot', type: 'bytes32' },
          { name: 'minContribution', type: 'uint256' },
          { name: 'maxContribution', type: 'uint256' },
          { name: 'privateRoundStart', type: 'uint256' },
          { name: 'privateRoundEnd', type: 'uint256' },
          { name: 'splitOption', type: 'uint8' },
          { name: 'treasuryCap', type: 'uint256' },
          { name: 'treasuryAddress', type: 'address' },
          { name: 'tgeUnlockBps', type: 'uint256' },
          { name: 'vestingCliff', type: 'uint256' },
          { name: 'vestingDuration', type: 'uint256' },
        ],
      },
    ],
    name: 'createLaunch',
    outputs: [{ name: 'launchId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'launchId', type: 'uint256' },
      { name: 'merkleProof', type: 'bytes32[]' },
    ],
    name: 'contribute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'launchId', type: 'uint256' }],
    name: 'launchToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'launchId', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'launchId', type: 'uint256' }],
    name: 'getLaunch',
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'status', type: 'uint8' },
      { name: 'splitOption', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'totalTokensAllocated', type: 'uint256' },
      { name: 'launchTimestamp', type: 'uint256' },
      { name: 'privateRoundStart', type: 'uint256' },
      { name: 'privateRoundEnd', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'splitOption', type: 'uint8' }],
    name: 'getHardCap',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'splitOption', type: 'uint8' }],
    name: 'getSplitDetails',
    outputs: [
      { name: 'privatePercent', type: 'uint256' },
      { name: 'publicPercent', type: 'uint256' },
      { name: 'hardCapMon', type: 'uint256' },
      { name: 'publicCurveMon', type: 'uint256' },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'launchCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Split options
export const SPLIT_OPTIONS = {
  SPLIT_70_30: 0,
  SPLIT_50_50: 1,
  SPLIT_30_70: 2,
} as const;

// Vesting presets
export const VESTING_PRESETS = {
  CUSTOM: 0,
  NO_VESTING: 1,
  MEME: 2,
  COMMUNITY: 3,
  STANDARD: 4,
  LONG_TERM: 5,
  BUILDER: 6,
} as const;

// Default configuration for new Moltank
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
