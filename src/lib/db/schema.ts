import { pgTable, text, boolean, timestamp, integer, serial, jsonb } from 'drizzle-orm/pg-core';

export const agentWallets = pgTable('agent_wallets', {
  agentId: text('agent_id').primaryKey(),
  address: text('address').notNull(),
  moltbookName: text('moltbook_name'),
  moltbookPostId: text('moltbook_post_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pendingRegistrations = pgTable('pending_registrations', {
  verificationCode: text('verification_code').primaryKey(),
  address: text('address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sovereignSubmolts = pgTable('sovereign_submolts', {
  submoltId: text('submolt_id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  tokenName: text('token_name').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  earlyAccessKarma: integer('early_access_karma').notNull(),
  gatedChannelKarma: integer('gated_channel_karma').notNull(),
  creatorAllocation: integer('creator_allocation').notNull(),
  creatorAgentId: text('creator_agent_id').notNull(),
  treasuryAddress: text('treasury_address').notNull(),
  tokenAddress: text('token_address').notNull(),
  tokenSupply: text('token_supply').notNull(),
  tokenDeployed: boolean('token_deployed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tokenLaunches = pgTable('token_launches', {
  id: serial('id').primaryKey(),
  submoltId: text('submolt_id'),
  agentId: text('agent_id').notNull(),
  tokenAddress: text('token_address'),
  salt: text('salt'),
  metadataUri: text('metadata_uri'),
  imageUri: text('image_uri'),
  status: text('status', { enum: ['pending', 'deployed', 'failed'] }).default('pending').notNull(),
  txHash: text('tx_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tankLaunches = pgTable('tank_launches', {
  id: serial('id').primaryKey(),
  tankId: text('tank_id').notNull(),
  launchCode: text('launch_code'),
  creatorAgentId: text('creator_agent_id').notNull(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  tokenUri: text('token_uri').notNull(),
  splitOption: text('split_option').notNull(),
  vestingPreset: text('vesting_preset').notNull(),
  merkleRoot: text('merkle_root').notNull(),
  proofs: jsonb('proofs'), // serialized proofs map
  whitelist: jsonb('whitelist'), // original whitelist array
  minContribution: text('min_contribution').notNull(),
  maxContribution: text('max_contribution').notNull(),
  privateRoundStart: integer('private_round_start').notNull(),
  privateRoundEnd: integer('private_round_end').notNull(),
  treasuryCap: text('treasury_cap').notNull(),
  treasuryAddress: text('treasury_address').notNull(),
  onChainLaunchId: integer('on_chain_launch_id'),
  txHash: text('tx_hash'),
  status: text('status', { enum: ['pending', 'draft', 'created', 'active', 'launched', 'cancelled'] }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
