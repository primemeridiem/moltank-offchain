// Smart Contract ABIs for Sovereign Submolts

export const SovereignSubmoltFactoryABI = [
  {
    type: 'function',
    name: 'createSovereignSubmolt',
    inputs: [
      { name: 'submoltId', type: 'string' },
      { name: 'tokenName', type: 'string' },
      { name: 'tokenSymbol', type: 'string' },
      { name: 'earlyAccessKarma', type: 'uint256' },
      { name: 'gatedChannelKarma', type: 'uint256' },
      { name: 'creatorAllocation', type: 'uint256' },
      { name: 'creatorAddress', type: 'address' },
    ],
    outputs: [
      { name: 'submoltAddress', type: 'address' },
      { name: 'tokenAddress', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getSovereignSubmolt',
    inputs: [{ name: 'submoltId', type: 'string' }],
    outputs: [
      { name: 'submoltAddress', type: 'address' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'treasuryAddress', type: 'address' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SovereignSubmoltCreated',
    inputs: [
      { name: 'submoltId', type: 'string', indexed: true },
      { name: 'submoltAddress', type: 'address', indexed: false },
      { name: 'tokenAddress', type: 'address', indexed: false },
      { name: 'creator', type: 'address', indexed: true },
    ],
  },
] as const;

export const SubmoltTokenABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'tip',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'contentId', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Tip',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'contentId', type: 'string', indexed: false },
    ],
  },
] as const;

export const TreasuryABI = [
  {
    type: 'function',
    name: 'balance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenBalance',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'executeProposal',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'ProposalExecuted',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'executor', type: 'address', indexed: true },
    ],
  },
] as const;

export const GovernanceABI = [
  {
    type: 'function',
    name: 'propose',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'castVote',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getProposal',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'proposer', type: 'address' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'againstVotes', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'endTime', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'proposer', type: 'address', indexed: true },
      { name: 'title', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'support', type: 'bool', indexed: false },
      { name: 'weight', type: 'uint256', indexed: false },
    ],
  },
] as const;
