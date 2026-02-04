import { Elysia, t } from 'elysia';
import { getMoltbookClient } from '@/lib/moltbook/client';
import { DEFAULT_CONFIG } from '@/lib/contracts/config';

// In-memory store for demo (replace with database in production)
const sovereignSubmolts = new Map<string, {
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
}>();

const tips = new Map<string, {
  id: string;
  from: string;
  to: string;
  amount: string;
  submoltId: string;
  contentId?: string;
  contentType?: 'post' | 'comment';
  timestamp: Date;
}[]>();

// Mock token deployment (simulates nad.fun token launch on Monad)
function deployToken(tokenName: string, tokenSymbol: string, creatorAllocation: number) {
  const tokenAddress = '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  const treasuryAddress = '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  const totalSupply = '1000000000000000000000000'; // 1M tokens with 18 decimals

  console.log(`[Token Deploy] ${tokenName} (${tokenSymbol})`);
  console.log(`  Token Address: ${tokenAddress}`);
  console.log(`  Treasury Address: ${treasuryAddress}`);
  console.log(`  Total Supply: ${totalSupply}`);
  console.log(`  Creator Allocation: ${creatorAllocation}%`);

  return {
    tokenAddress,
    treasuryAddress,
    totalSupply,
  };
}

const app = new Elysia({ prefix: '/api' })
  // Health check
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // ============================================
  // Sovereign Submolt Endpoints
  // ============================================

  // Create/Initialize a Sovereign Submolt with token deployment
  // Can be called by:
  // 1. Agent with enough karma who wants to upgrade a Moltbook submolt
  // 2. Submolt creator who wants to deploy token for their existing submolt
  .post(
    '/submolts/sovereign',
    async ({ body, headers }) => {
      const moltbook = getMoltbookClient();

      // Verify agent identity
      const identityToken = headers['x-moltbook-identity'];
      if (!identityToken) {
        return { success: false, error: 'Missing Moltbook identity token' };
      }

      const verification = await moltbook.verifyIdentity(identityToken);
      if (!verification.success || !verification.agent) {
        return { success: false, error: 'Invalid identity token' };
      }

      const agent = verification.agent;

      // Check if sovereign submolt already exists
      if (sovereignSubmolts.has(body.submoltId)) {
        return { success: false, error: 'Sovereign Submolt already exists for this submolt' };
      }

      // Try to get submolt from Moltbook (may not exist if creating fresh)
      const moltbookSubmolt = await moltbook.getSubmolt(body.submoltId);

      // Determine if agent can create:
      // 1. If submolt exists on Moltbook - must be creator OR have enough karma
      // 2. If submolt doesn't exist on Moltbook - must have enough karma
      const isSubmoltCreator = moltbookSubmolt?.creatorId === agent.id;
      const hasEnoughKarma = agent.karma >= DEFAULT_CONFIG.MIN_KARMA_TO_CREATE;

      if (!isSubmoltCreator && !hasEnoughKarma) {
        return {
          success: false,
          error: moltbookSubmolt
            ? `Only the submolt creator or agents with ${DEFAULT_CONFIG.MIN_KARMA_TO_CREATE}+ karma can upgrade this submolt. You have ${agent.karma} karma.`
            : `Need ${DEFAULT_CONFIG.MIN_KARMA_TO_CREATE}+ karma to create. You have ${agent.karma} karma.`,
        };
      }

      // Deploy token on Monad via nad.fun (mock for demo)
      const creatorAllocation = Math.min(
        body.creatorAllocation ?? DEFAULT_CONFIG.DEFAULT_CREATOR_ALLOCATION,
        DEFAULT_CONFIG.MAX_CREATOR_ALLOCATION
      );

      const tokenDeployment = deployToken(
        body.tokenName,
        body.tokenSymbol,
        creatorAllocation
      );

      // Create sovereign submolt record
      const sovereignSubmolt = {
        submoltId: body.submoltId,
        name: moltbookSubmolt?.name || body.tokenName,
        description: moltbookSubmolt?.description || `Sovereign Submolt for ${body.submoltId}`,
        tokenName: body.tokenName,
        tokenSymbol: body.tokenSymbol,
        earlyAccessKarma: body.earlyAccessKarma ?? DEFAULT_CONFIG.DEFAULT_EARLY_ACCESS_KARMA,
        gatedChannelKarma: body.gatedChannelKarma ?? DEFAULT_CONFIG.DEFAULT_GATED_CHANNEL_KARMA,
        creatorAllocation,
        creatorAgentId: agent.id,
        treasuryAddress: tokenDeployment.treasuryAddress,
        tokenAddress: tokenDeployment.tokenAddress,
        tokenSupply: tokenDeployment.totalSupply,
        createdAt: new Date(),
        tokenDeployed: true,
      };

      sovereignSubmolts.set(body.submoltId, sovereignSubmolt);
      tips.set(body.submoltId, []);

      return {
        success: true,
        data: sovereignSubmolt,
        message: isSubmoltCreator
          ? 'Token deployed for your submolt!'
          : 'Sovereign Submolt created with new token!',
      };
    },
    {
      body: t.Object({
        submoltId: t.String(),
        tokenName: t.String(),
        tokenSymbol: t.String(),
        earlyAccessKarma: t.Optional(t.Number()),
        gatedChannelKarma: t.Optional(t.Number()),
        creatorAllocation: t.Optional(t.Number()),
      }),
    }
  )

  // Get Sovereign Submolt by ID
  .get('/submolts/sovereign/:submoltId', ({ params }) => {
    const sovereignSubmolt = sovereignSubmolts.get(params.submoltId);
    if (!sovereignSubmolt) {
      return { success: false, error: 'Sovereign Submolt not found' };
    }

    return {
      success: true,
      data: sovereignSubmolt,
    };
  })

  // List all Sovereign Submolts
  .get('/submolts/sovereign', () => {
    return {
      success: true,
      data: Array.from(sovereignSubmolts.values()),
    };
  })

  // Get stats
  .get('/stats', () => {
    const allTips = Array.from(tips.values()).flat();
    const uniqueAgents = new Set<string>();
    allTips.forEach(tip => {
      uniqueAgents.add(tip.from);
      uniqueAgents.add(tip.to);
    });

    return {
      success: true,
      data: {
        totalSubmolts: sovereignSubmolts.size,
        totalTips: allTips.length,
        totalAgents: uniqueAgents.size,
        totalVolume: allTips.reduce((sum, tip) => sum + BigInt(tip.amount), 0n).toString(),
      },
    };
  })

  // ============================================
  // Whitelist / Access Check Endpoints
  // ============================================

  // Check if agent has access to a tier
  .get(
    '/submolts/sovereign/:submoltId/access/:agentId',
    async ({ params }) => {
      const moltbook = getMoltbookClient();
      const sovereignSubmolt = sovereignSubmolts.get(params.submoltId);

      if (!sovereignSubmolt) {
        return { success: false, error: 'Sovereign Submolt not found' };
      }

      const agent = await moltbook.getAgent(params.agentId);
      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      const access = {
        agentId: agent.id,
        karma: agent.karma,
        canCreate: agent.karma >= DEFAULT_CONFIG.MIN_KARMA_TO_CREATE,
        hasEarlyAccess: agent.karma >= sovereignSubmolt.earlyAccessKarma,
        hasGatedChannelAccess: agent.karma >= sovereignSubmolt.gatedChannelKarma,
        isCreator: agent.id === sovereignSubmolt.creatorAgentId,
      };

      return { success: true, data: access };
    }
  )

  // ============================================
  // Tip Endpoints
  // ============================================

  // Send a tip
  .post(
    '/submolts/sovereign/:submoltId/tips',
    async ({ params, body, headers }) => {
      const moltbook = getMoltbookClient();

      // Verify agent identity
      const identityToken = headers['x-moltbook-identity'];
      if (!identityToken) {
        return { success: false, error: 'Missing Moltbook identity token' };
      }

      const verification = await moltbook.verifyIdentity(identityToken);
      if (!verification.success || !verification.agent) {
        return { success: false, error: 'Invalid identity token' };
      }

      const sovereignSubmolt = sovereignSubmolts.get(params.submoltId);
      if (!sovereignSubmolt) {
        return { success: false, error: 'Sovereign Submolt not found' };
      }

      // Create tip record
      const tip = {
        id: crypto.randomUUID(),
        from: verification.agent.id,
        to: body.toAgentId,
        amount: body.amount,
        submoltId: params.submoltId,
        contentId: body.contentId,
        contentType: body.contentType as 'post' | 'comment' | undefined,
        timestamp: new Date(),
      };

      const submoltTips = tips.get(params.submoltId) || [];
      submoltTips.push(tip);
      tips.set(params.submoltId, submoltTips);

      return {
        success: true,
        data: tip,
      };
    },
    {
      body: t.Object({
        toAgentId: t.String(),
        amount: t.String(),
        contentId: t.Optional(t.String()),
        contentType: t.Optional(t.String()),
      }),
    }
  )

  // Get tips for a submolt
  .get('/submolts/sovereign/:submoltId/tips', ({ params, query }) => {
    const sovereignSubmolt = sovereignSubmolts.get(params.submoltId);
    if (!sovereignSubmolt) {
      return { success: false, error: 'Sovereign Submolt not found' };
    }

    let submoltTips = tips.get(params.submoltId) || [];

    // Filter by agent if provided
    if (query.agentId) {
      submoltTips = submoltTips.filter(
        (t) => t.from === query.agentId || t.to === query.agentId
      );
    }

    return {
      success: true,
      data: submoltTips,
    };
  })

  // Get tip leaderboard
  .get('/submolts/sovereign/:submoltId/leaderboard', ({ params }) => {
    const sovereignSubmolt = sovereignSubmolts.get(params.submoltId);
    if (!sovereignSubmolt) {
      return { success: false, error: 'Sovereign Submolt not found' };
    }

    const submoltTips = tips.get(params.submoltId) || [];

    // Calculate totals per agent
    const totals = new Map<string, { received: bigint; given: bigint }>();

    for (const tip of submoltTips) {
      const amount = BigInt(tip.amount);

      // Update receiver
      const receiverTotals = totals.get(tip.to) || { received: 0n, given: 0n };
      receiverTotals.received += amount;
      totals.set(tip.to, receiverTotals);

      // Update giver
      const giverTotals = totals.get(tip.from) || { received: 0n, given: 0n };
      giverTotals.given += amount;
      totals.set(tip.from, giverTotals);
    }

    // Convert to array and sort by received
    const leaderboard = Array.from(totals.entries())
      .map(([agentId, amounts]) => ({
        agentId,
        received: amounts.received.toString(),
        given: amounts.given.toString(),
      }))
      .sort((a, b) => {
        const aReceived = BigInt(a.received);
        const bReceived = BigInt(b.received);
        return bReceived > aReceived ? 1 : bReceived < aReceived ? -1 : 0;
      });

    return {
      success: true,
      data: leaderboard,
    };
  });

// Export handlers for Next.js
export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;

// Export app instance for Eden client
export { app };
