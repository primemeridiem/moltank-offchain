import { Elysia, t } from 'elysia';
import { getMoltbookClient } from '@/lib/moltbook/client';
import { DEFAULT_CONFIG } from '@/lib/contracts/config';

// In-memory store for demo (replace with database in production)
const sovereignSubmolts = new Map<string, {
  submoltId: string;
  tokenName: string;
  tokenSymbol: string;
  earlyAccessKarma: number;
  gatedChannelKarma: number;
  creatorAllocation: number;
  creatorAgentId: string;
  treasuryAddress: string;
  tokenAddress: string;
  createdAt: Date;
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

const app = new Elysia({ prefix: '/api' })
  // Health check
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // ============================================
  // Sovereign Submolt Endpoints
  // ============================================

  // Create a new Sovereign Submolt
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

      // Check karma threshold
      if (agent.karma < DEFAULT_CONFIG.MIN_KARMA_TO_CREATE) {
        return {
          success: false,
          error: `Insufficient karma. Need ${DEFAULT_CONFIG.MIN_KARMA_TO_CREATE}, have ${agent.karma}`,
        };
      }

      // Check if submolt already exists
      if (sovereignSubmolts.has(body.submoltId)) {
        return { success: false, error: 'Sovereign Submolt already exists for this submolt' };
      }

      // Verify submolt exists on Moltbook
      const submolt = await moltbook.getSubmolt(body.submoltId);
      if (!submolt) {
        return { success: false, error: 'Submolt not found on Moltbook' };
      }

      // Create sovereign submolt record
      const sovereignSubmolt = {
        submoltId: body.submoltId,
        tokenName: body.tokenName,
        tokenSymbol: body.tokenSymbol,
        earlyAccessKarma: body.earlyAccessKarma ?? DEFAULT_CONFIG.DEFAULT_EARLY_ACCESS_KARMA,
        gatedChannelKarma: body.gatedChannelKarma ?? DEFAULT_CONFIG.DEFAULT_GATED_CHANNEL_KARMA,
        creatorAllocation: Math.min(
          body.creatorAllocation ?? DEFAULT_CONFIG.DEFAULT_CREATOR_ALLOCATION,
          DEFAULT_CONFIG.MAX_CREATOR_ALLOCATION
        ),
        creatorAgentId: agent.id,
        treasuryAddress: '0x' + '0'.repeat(40), // Placeholder - would be created on-chain
        tokenAddress: '0x' + '0'.repeat(40), // Placeholder - would be created on-chain
        createdAt: new Date(),
      };

      sovereignSubmolts.set(body.submoltId, sovereignSubmolt);
      tips.set(body.submoltId, []);

      return {
        success: true,
        data: sovereignSubmolt,
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
export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;

// Export app type for Eden client
export type App = typeof app;
