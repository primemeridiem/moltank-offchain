// Envio Indexer GraphQL Client
// The moltank-indexer runs separately and exposes a GraphQL API

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:8080/v1/graphql';

async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(INDEXER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Indexer query failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${json.errors[0]?.message}`);
  }

  return json.data;
}

// ── Types matching indexer schema ────────────────────────────────────────────

export interface IndexedLaunch {
  id: string;
  launchId: string; // bigint as string
  creator: string;
  tankId: string;
  name: string;
  symbol: string;
  splitOption: 'SPLIT_70_30' | 'SPLIT_50_50' | 'SPLIT_30_70';
  tgeUnlockBps: string;
  vestingCliff: string;
  vestingDuration: string;
  status: 'ACTIVE' | 'LAUNCHED' | 'CANCELLED';
  totalRaised: string;
  contributorCount: number;
  tokenAddress: string | null;
  tokensAllocated: string | null;
  treasuryAmount: string | null;
  createdAtBlock: number;
  createdAtTimestamp: number;
  launchedAtBlock: number | null;
  launchedAtTimestamp: number | null;
  txHash: string;
}

export interface IndexedContribution {
  id: string;
  launchId: string;
  contributor: string;
  amount: string;
  blockNumber: number;
  timestamp: number;
  txHash: string;
}

export interface IndexedUserPosition {
  id: string;
  launchId: string;
  user: string;
  totalContributed: string;
  totalClaimed: string;
  totalRefunded: string;
}

export interface IndexedGlobalStats {
  id: string;
  totalLaunches: number;
  totalLaunched: number;
  totalCancelled: number;
  totalRaised: string;
  totalContributions: number;
}

// ── Queries ─────────────────────────────────────────────────────────────────

/** Get all launches, newest first */
export async function getIndexedLaunches(limit = 50, offset = 0): Promise<IndexedLaunch[]> {
  const data = await graphqlQuery<{ Launch: IndexedLaunch[] }>(`
    query GetLaunches($limit: Int!, $offset: Int!) {
      Launch(limit: $limit, offset: $offset, order_by: { createdAtTimestamp: desc }) {
        id
        launchId
        creator
        tankId
        name
        symbol
        splitOption
        tgeUnlockBps
        vestingCliff
        vestingDuration
        status
        totalRaised
        contributorCount
        tokenAddress
        tokensAllocated
        treasuryAmount
        createdAtBlock
        createdAtTimestamp
        launchedAtBlock
        launchedAtTimestamp
        txHash
      }
    }
  `, { limit, offset });

  return data.Launch;
}

/** Get a single launch by on-chain ID */
export async function getIndexedLaunch(launchId: string): Promise<IndexedLaunch | null> {
  const data = await graphqlQuery<{ Launch: IndexedLaunch[] }>(`
    query GetLaunch($id: String!) {
      Launch(where: { id: { _eq: $id } }) {
        id
        launchId
        creator
        tankId
        name
        symbol
        splitOption
        tgeUnlockBps
        vestingCliff
        vestingDuration
        status
        totalRaised
        contributorCount
        tokenAddress
        tokensAllocated
        treasuryAmount
        createdAtBlock
        createdAtTimestamp
        launchedAtBlock
        launchedAtTimestamp
        txHash
      }
    }
  `, { id: launchId });

  return data.Launch[0] ?? null;
}

/** Get contributions for a launch */
export async function getIndexedContributions(launchId: string): Promise<IndexedContribution[]> {
  const data = await graphqlQuery<{ Contribution: IndexedContribution[] }>(`
    query GetContributions($launchId: numeric!) {
      Contribution(where: { launchId: { _eq: $launchId } }, order_by: { timestamp: desc }) {
        id
        launchId
        contributor
        amount
        blockNumber
        timestamp
        txHash
      }
    }
  `, { launchId: parseInt(launchId) });

  return data.Contribution;
}

/** Get user position in a launch */
export async function getIndexedUserPosition(launchId: string, user: string): Promise<IndexedUserPosition | null> {
  const id = `${launchId}-${user}`;
  const data = await graphqlQuery<{ UserLaunchPosition: IndexedUserPosition[] }>(`
    query GetPosition($id: String!) {
      UserLaunchPosition(where: { id: { _eq: $id } }) {
        id
        launchId
        user
        totalContributed
        totalClaimed
        totalRefunded
      }
    }
  `, { id });

  return data.UserLaunchPosition[0] ?? null;
}

/** Get all positions for a launch */
export async function getIndexedPositionsByLaunch(launchId: string): Promise<IndexedUserPosition[]> {
  const data = await graphqlQuery<{ UserLaunchPosition: IndexedUserPosition[] }>(`
    query GetPositionsByLaunch($launchId: numeric!) {
      UserLaunchPosition(where: { launchId: { _eq: $launchId } }) {
        id
        launchId
        user
        totalContributed
        totalClaimed
        totalRefunded
      }
    }
  `, { launchId: parseInt(launchId) });

  return data.UserLaunchPosition;
}

/** Get global protocol stats */
export async function getIndexedGlobalStats(): Promise<IndexedGlobalStats | null> {
  const data = await graphqlQuery<{ GlobalStats: IndexedGlobalStats[] }>(`
    query GetGlobalStats {
      GlobalStats(where: { id: { _eq: "global" } }) {
        id
        totalLaunches
        totalLaunched
        totalCancelled
        totalRaised
        totalContributions
      }
    }
  `);

  return data.GlobalStats[0] ?? null;
}

/** Get launches by creator address */
export async function getIndexedLaunchesByCreator(creator: string): Promise<IndexedLaunch[]> {
  const data = await graphqlQuery<{ Launch: IndexedLaunch[] }>(`
    query GetLaunchesByCreator($creator: String!) {
      Launch(where: { creator: { _eq: $creator } }, order_by: { createdAtTimestamp: desc }) {
        id
        launchId
        creator
        tankId
        name
        symbol
        splitOption
        status
        totalRaised
        contributorCount
        tokenAddress
        createdAtTimestamp
        txHash
      }
    }
  `, { creator: creator.toLowerCase() });

  return data.Launch;
}
