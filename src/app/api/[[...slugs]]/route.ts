import { Elysia, t } from "elysia";
import { SignJWT, jwtVerify } from "jose";
import { getMoltbookClient } from "@/lib/moltbook/client";
import {
  DEFAULT_CONFIG,
  SPLIT_OPTIONS,
  VESTING_PRESETS,
} from "@/lib/contracts/config";
import { db } from "@/lib/db";
import { sovereignSubmolts, tankLaunches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  registerAgentWallet,
  getAgentWallet,
  getAgentByAddress,
  verifyWalletSignature,
  generateVerificationCode,
  createPendingRegistration,
  getPendingRegistration,
  deletePendingRegistration,
} from "@/lib/wallet";
import { uploadImage, uploadMetadata } from "@/lib/nadfun";
import {
  buildCreateLaunchTx,
  buildContributeTx,
  buildLaunchTokenTx,
  buildClaimTx,
} from "@/lib/launch";
import {
  getIndexedLaunches,
  getIndexedLaunch,
  getIndexedContributions,
  getIndexedUserPosition,
  getIndexedPositionsByLaunch,
  getIndexedGlobalStats,
} from "@/lib/indexer";
// import { getOnChainLaunchIdFromTx } from "@/lib/contracts/reader";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "moltank-dev-secret",
);
const JWT_EXPIRY = "24h";

interface JwtAgentPayload {
  agentId: string;
  address: string;
  moltbookName: string;
  karma: number;
  followerCount: number;
  isClaimed: boolean;
}

// Create a JWT for a verified agent
async function createToken(agent: JwtAgentPayload) {
  return new SignJWT({ ...agent })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

// Helper: verify agent identity from Authorization header (JWT)
async function verifyAgent(headers: Record<string, string | undefined>) {
  const authHeader = headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false as const,
      error: "Missing Authorization header. Use: Authorization: Bearer <token>",
    };
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const agentId = payload.agentId as string;
    const address = payload.address as string;
    const moltbookName = payload.moltbookName as string;
    const karma = (payload.karma as number) || 0;

    if (!agentId || !address) {
      return { success: false as const, error: "Invalid token payload" };
    }

    return {
      success: true as const,
      agent: { id: agentId, address, moltbookName, karma },
    };
  } catch {
    return {
      success: false as const,
      error: "Invalid or expired token. Re-verify via POST /api/auth/verify",
    };
  }
}

const app = new Elysia({ prefix: "/api" })
  // Health check
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

  // ============================================
  // Auth: Two-step Moltbook verification
  // Step 1: Register (verify signature, get code)
  // Step 2: Verify (post code on Moltbook, confirm)
  // ============================================

  .post(
    "/auth/register",
    async ({ body }) => {
      const { address, signature } = body;

      // Verify the signature proves ownership of the address
      const message = `moltank-verify:${address.toLowerCase()}`;
      const valid = await verifyWalletSignature(address, message, signature);
      if (!valid) {
        return {
          success: false,
          error: "Signature does not match the provided address. Sign the message: moltank-verify:<your_address_in_lowercase>",
        };
      }

      // Check if already registered
      const existing = await getAgentByAddress(address.toLowerCase());
      if (existing) {
        return {
          success: false,
          error: "This address is already registered. Use POST /api/auth/verify to get a new token.",
        };
      }

      // Generate verification code and store pending registration
      const verificationCode = generateVerificationCode();
      await createPendingRegistration(address, verificationCode);

      return {
        success: true,
        data: { verificationCode },
        message: `Post this code on Moltbook to verify your identity: ${verificationCode}`,
      };
    },
    {
      body: t.Object({
        address: t.String({ description: "Your wallet address" }),
        signature: t.String({ description: "Signature of 'moltank-verify:<lowercase_address>'" }),
      }),
    },
  )

  .post(
    "/auth/verify",
    async ({ body }) => {
      const { postId, verificationCode } = body;

      // Look up pending registration by code
      const pending = await getPendingRegistration(verificationCode);
      if (!pending) {
        return {
          success: false,
          error: "Verification code not found. Call POST /api/auth/register first.",
        };
      }

      // Fetch the post from Moltbook
      const moltbook = getMoltbookClient();
      const post = await moltbook.getPost(postId);
      if (!post) {
        return { success: false, error: "Post not found on Moltbook" };
      }

      // Check post content contains the verification code
      if (!post.content.includes(verificationCode)) {
        return {
          success: false,
          error: "Verification code not found in post content.",
        };
      }

      // Author info comes directly from the post
      const { author } = post;

      // Register/link: agentName ↔ wallet address
      try {
        const result = await registerAgentWallet(
          author.name,
          pending.address,
          author.name,
          postId,
        );

        // Clean up pending registration
        await deletePendingRegistration(verificationCode);

        const token = await createToken({
          agentId: author.name,
          address: result.address,
          moltbookName: author.name,
          karma: author.karma,
          followerCount: author.follower_count,
          isClaimed: true,
        });
        return {
          success: true,
          data: {
            token,
            agentName: author.name,
            address: result.address,
            karma: author.karma,
            followerCount: author.follower_count,
            alreadyExists: result.alreadyExists,
          },
          message: result.alreadyExists
            ? "Identity already verified. Use the token for authenticated requests."
            : "Identity verified and wallet linked. Use the token for authenticated requests.",
        };
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Verification failed",
        };
      }
    },
    {
      body: t.Object({
        postId: t.String({ description: "Moltbook post ID containing your verification code" }),
        verificationCode: t.String({ description: "The verification code from /auth/register" }),
      }),
    },
  )

  // ============================================
  // Token Metadata Helpers (for launch tokenURI)
  // ============================================

  .post(
    "/launches/upload-image",
    async ({ headers, body }) => {
      const auth = await verifyAgent(headers);
      if (!auth.success) return { success: false, error: auth.error };

      try {
        const imageBuffer = Buffer.from(body.image, "base64");
        const imageUri = await uploadImage(imageBuffer, body.contentType);
        return { success: true, data: { imageUri } };
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Image upload failed",
        };
      }
    },
    {
      body: t.Object({
        image: t.String({ description: "Base64 encoded image" }),
        contentType: t.String({
          description: "Image MIME type, e.g. image/png",
        }),
      }),
    },
  )

  .post(
    "/launches/upload-metadata",
    async ({ headers, body }) => {
      const auth = await verifyAgent(headers);
      if (!auth.success) return { success: false, error: auth.error };

      try {
        const metadataUri = await uploadMetadata({
          name: body.name,
          symbol: body.symbol,
          description: body.description,
          imageUri: body.imageUri,
          website: body.website,
          twitter: body.twitter,
          telegram: body.telegram,
        });
        return { success: true, data: { metadataUri } };
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Metadata upload failed",
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        symbol: t.String(),
        description: t.String(),
        imageUri: t.String(),
        website: t.Optional(t.String()),
        twitter: t.Optional(t.String()),
        telegram: t.Optional(t.String()),
      }),
    },
  )

  // ============================================
  // Tank Launch Endpoints (MoltTank contract)
  // ============================================

  // Easy launch: agent sends submolt name, BE verifies ownership and returns unsigned TX
  .post(
    "/launches/create-by-submolt",
    async ({ headers, body }) => {
      const auth = await verifyAgent(headers);
      if (!auth.success) return { success: false, error: auth.error };

      const wallet = await getAgentWallet(auth.agent.id);
      if (!wallet) {
        return { success: false, error: "No wallet registered." };
      }

      const submoltId = body.submoltId;

      // Check if submolt already has a launch
      const existingLaunches = await db
        .select()
        .from(tankLaunches)
        .where(eq(tankLaunches.tankId, submoltId));
      if (existingLaunches.length > 0 && existingLaunches[0].status !== 'cancelled') {
        return {
          success: false,
          error: `Submolt "${submoltId}" already has a launch (id: ${existingLaunches[0].id}).`,
        };
      }

      // Fetch submolt from Moltbook and verify ownership
      const moltbook = getMoltbookClient();
      const submolt = await moltbook.getSubmolt(submoltId);
      if (!submolt) {
        return { success: false, error: `Submolt "${submoltId}" not found on Moltbook.` };
      }

      // Check if the authenticated agent is the submolt owner
      const isOwner =
        submolt.created_by?.name === auth.agent.moltbookName ||
        submolt.moderators?.some(
          (m) => m.name === auth.agent.moltbookName && m.role === "owner",
        );
      if (!isOwner) {
        return {
          success: false,
          error: `You are not the owner of submolt "${submoltId}". Only the submolt owner can create a launch.`,
        };
      }

      // Auto-configure from submolt info
      const name = body.name || submolt.display_name || submolt.name;
      const symbol = body.symbol || submolt.name.slice(0, 6).toUpperCase();

      // Auto-upload metadata
      let tokenUri = "";
      try {
        tokenUri = await uploadMetadata({
          name,
          symbol,
          description: body.description || submolt.description || `Community launch for ${submolt.name}`,
          imageUri: "",
        });
      } catch {
        // Metadata upload failed, continue with empty URI
      }

      // Build TX with sensible defaults
      const now = Math.floor(Date.now() / 1000);
      const whitelist = body.whitelist || [wallet.address];

      try {
        const result = buildCreateLaunchTx({
          tankId: submoltId,
          name,
          symbol,
          tokenURI: tokenUri,
          whitelist,
          minContributionMon: "1",
          maxContributionMon: "50000",
          privateRoundStart: now + 120,
          privateRoundEnd: now + 420,
          splitOption: "SPLIT_50_50",
          treasuryCapMon: "0",
          treasuryAddress: "0x0000000000000000000000000000000000000000",
          vestingPreset: "MEME",
        });

        const [launch] = await db
          .insert(tankLaunches)
          .values({
            tankId: submoltId,
            creatorAgentId: auth.agent.id,
            name,
            symbol,
            tokenUri,
            splitOption: "SPLIT_50_50",
            vestingPreset: "MEME",
            merkleRoot: result.merkleRoot,
            proofs: result.proofs,
            whitelist,
            minContribution: "1",
            maxContribution: "50000",
            privateRoundStart: now + 120,
            privateRoundEnd: now + 420,
            treasuryCap: "0",
            treasuryAddress: "0x0000000000000000000000000000000000000000",
            status: "draft",
          })
          .returning();

        return {
          success: true,
          data: {
            launchId: launch.id,
            submolt: submoltId,
            name,
            symbol,
            tx: result.tx,
            merkleRoot: result.merkleRoot,
            proofs: result.proofs,
          },
          message: `Launch created for submolt "${submoltId}". Sign and broadcast the TX, then call POST /api/launches/${launch.id}/confirm with your txHash.`,
        };
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Failed to build launch tx",
        };
      }
    },
    {
      body: t.Object({
        submoltId: t.String({ description: "The Moltbook submolt name to launch from (you must be the owner)" }),
        name: t.Optional(t.String({ description: "Token name (defaults to submolt display name)" })),
        symbol: t.Optional(t.String({ description: "Token symbol (defaults to submolt name, max 6 chars)" })),
        description: t.Optional(t.String({ description: "Description (defaults to submolt description)" })),
        whitelist: t.Optional(t.Array(t.String(), { description: "Whitelist addresses (defaults to your wallet)" })),
      }),
    },
  )

  .post(
    "/launches/create",
    async ({ headers, body }) => {
      const auth = await verifyAgent(headers);
      if (!auth.success) return { success: false, error: auth.error };

      const wallet = await getAgentWallet(auth.agent.id);
      if (!wallet) {
        return { success: false, error: "No wallet registered." };
      }

      // Check if tankId already exists in DB
      const existingLaunches = await db
        .select()
        .from(tankLaunches)
        .where(eq(tankLaunches.tankId, body.tankId));
      if (existingLaunches.length > 0 && existingLaunches[0].status !== 'cancelled') {
        return {
          success: false,
          error: `Tank "${body.tankId}" already has a launch (id: ${existingLaunches[0].id}). Use a different tankId.`,
        };
      }

      if (!(body.splitOption in SPLIT_OPTIONS)) {
        return {
          success: false,
          error: `Invalid splitOption. Use: ${Object.keys(SPLIT_OPTIONS).join(", ")}`,
        };
      }
      if (!(body.vestingPreset in VESTING_PRESETS)) {
        return {
          success: false,
          error: `Invalid vestingPreset. Use: ${Object.keys(VESTING_PRESETS).join(", ")}`,
        };
      }

      const whitelist = body.whitelist || [wallet.address];

      try {
        const result = buildCreateLaunchTx({
          tankId: body.tankId,
          name: body.name,
          symbol: body.symbol,
          tokenURI: body.tokenURI,
          whitelist,
          minContributionMon: body.minContributionMon || "1",
          maxContributionMon: body.maxContributionMon || "50000",
          privateRoundStart: body.privateRoundStart,
          privateRoundEnd: body.privateRoundEnd,
          splitOption: body.splitOption as keyof typeof SPLIT_OPTIONS,
          treasuryCapMon: body.treasuryCapMon || "0",
          treasuryAddress:
            body.treasuryAddress ||
            "0x0000000000000000000000000000000000000000",
          vestingPreset: body.vestingPreset as keyof typeof VESTING_PRESETS,
        });

        const [launch] = await db
          .insert(tankLaunches)
          .values({
            tankId: body.tankId,
            creatorAgentId: auth.agent.id,
            name: body.name,
            symbol: body.symbol,
            tokenUri: body.tokenURI,
            splitOption: body.splitOption,
            vestingPreset: body.vestingPreset,
            merkleRoot: result.merkleRoot,
            proofs: result.proofs,
            whitelist: whitelist,
            minContribution: body.minContributionMon || "1",
            maxContribution: body.maxContributionMon || "50000",
            privateRoundStart: body.privateRoundStart,
            privateRoundEnd: body.privateRoundEnd,
            treasuryCap: body.treasuryCapMon || "0",
            treasuryAddress:
              body.treasuryAddress ||
              "0x0000000000000000000000000000000000000000",
            status: "draft",
          })
          .returning();

        return {
          success: true,
          data: {
            launchId: launch.id,
            tx: result.tx,
            merkleRoot: result.merkleRoot,
            proofs: result.proofs,
            hint: "Sign and broadcast with: cast send --rpc-url <RPC> --private-key <KEY> <to> <calldata>",
          },
        };
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Failed to build launch tx",
        };
      }
    },
    {
      body: t.Object({
        tankId: t.String({ description: "MoltBook tank/submolt ID" }),
        name: t.String({ description: "Token name" }),
        symbol: t.String({ description: "Token symbol" }),
        tokenURI: t.String({ description: "Token metadata URI" }),
        whitelist: t.Optional(
          t.Array(t.String(), {
            description: "Whitelist addresses (defaults to your wallet)",
          }),
        ),
        minContributionMon: t.Optional(
          t.String({ description: 'Min contribution in MON (default: "1")' }),
        ),
        maxContributionMon: t.Optional(
          t.String({
            description: 'Max contribution in MON (default: "50000")',
          }),
        ),
        privateRoundStart: t.Number({
          description: "Unix timestamp for private round start",
        }),
        privateRoundEnd: t.Number({
          description: "Unix timestamp for private round end",
        }),
        splitOption: t.String({
          description: "SPLIT_70_30 | SPLIT_50_50 | SPLIT_30_70",
        }),
        vestingPreset: t.String({
          description:
            "MEME | NO_VESTING | COMMUNITY | STANDARD | LONG_TERM | BUILDER | CUSTOM",
        }),
        treasuryCapMon: t.Optional(
          t.String({ description: 'Treasury cap in MON (default: "0")' }),
        ),
        treasuryAddress: t.Optional(
          t.String({ description: "Treasury address (default: zero address)" }),
        ),
      }),
    },
  )

  .post(
    "/launches/:id/contribute",
    async ({ headers, params, body }) => {
      const auth = await verifyAgent(headers);
      if (!auth.success) return { success: false, error: auth.error };

      const wallet = await getAgentWallet(auth.agent.id);
      if (!wallet) return { success: false, error: "No wallet registered." };

      const launchId = params.id;

      // Get launch from indexer
      const indexed = await getIndexedLaunch(launchId);
      if (!indexed) {
        return { success: false, error: `Launch ${launchId} not found` };
      }

      if (indexed.status !== 'ACTIVE') {
        return { success: false, error: `Launch is not active (status: ${indexed.status})` };
      }

      // Get proofs from DB by tankId (DB id != on-chain id)
      const launches = await db
        .select()
        .from(tankLaunches)
        .where(eq(tankLaunches.tankId, indexed.tankId));
      const launch = launches[0];

      const proofs = launch?.proofs as Record<string, string[]> | null;
      const proof = proofs?.[wallet.address.toLowerCase()] as
        | `0x${string}`[]
        | undefined;
      if (!proof)
        return {
          success: false,
          error: "Your wallet is not in the whitelist for this launch",
        };

      const tx = buildContributeTx(parseInt(launchId), proof, body.amountMon);

      return {
        success: true,
        data: {
          tx,
          proof,
          launch: indexed,
        },
      };
    },
    {
      body: t.Object({
        amountMon: t.String({ description: "Amount to contribute in MON" }),
      }),
    },
  )

  .post("/launches/:id/launch-token", async ({ headers, params }) => {
    const auth = await verifyAgent(headers);
    if (!auth.success) return { success: false, error: auth.error };

    const launchId = params.id;

    // Get launch from indexer
    const indexed = await getIndexedLaunch(launchId);
    if (!indexed) {
      return { success: false, error: `Launch ${launchId} not found` };
    }

    if (indexed.status !== 'ACTIVE') {
      return { success: false, error: `Launch is not active (status: ${indexed.status}). May already be launched.` };
    }

    const tx = buildLaunchTokenTx(parseInt(launchId));

    return {
      success: true,
      data: {
        tx,
        launch: indexed,
      },
    };
  })

  .post("/launches/:id/claim", async ({ headers, params }) => {
    const auth = await verifyAgent(headers);
    if (!auth.success) return { success: false, error: auth.error };

    const launchId = params.id;

    // Get launch from indexer
    const indexed = await getIndexedLaunch(launchId);
    if (!indexed) {
      return { success: false, error: `Launch ${launchId} not found` };
    }

    if (indexed.status !== 'LAUNCHED') {
      return { success: false, error: `Launch not yet launched (status: ${indexed.status}). Token must be launched first.` };
    }

    const tx = buildClaimTx(parseInt(launchId));

    return {
      success: true,
      data: {
        tx,
        launch: indexed,
      },
    };
  })

  // List launches from indexer
  .get("/launches", async () => {
    try {
      const launches = await getIndexedLaunches();
      return { success: true, data: launches, source: "indexer" };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Indexer unavailable",
      };
    }
  })

  .get("/launches/:id", async ({ params }) => {
    try {
      const indexed = await getIndexedLaunch(params.id);
      if (!indexed) {
        return { success: false, error: "Launch not found" };
      }

      // Merge with DB for proofs (lookup by tankId since DB id != on-chain id)
      const dbLaunches = await db
        .select()
        .from(tankLaunches)
        .where(eq(tankLaunches.tankId, indexed.tankId));
      const dbData = dbLaunches[0];

      return {
        success: true,
        data: {
          ...indexed,
          whitelist: dbData?.whitelist,
          proofs: dbData?.proofs,
          merkleRoot: dbData?.merkleRoot,
        },
        source: "indexer",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to fetch launch",
      };
    }
  })

  .get("/launches/:id/contributions", async ({ params }) => {
    try {
      const contributions = await getIndexedContributions(params.id);
      return { success: true, data: contributions };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to fetch contributions",
      };
    }
  })

  .get("/launches/:id/position/:address", async ({ params }) => {
    try {
      const position = await getIndexedUserPosition(
        params.id,
        params.address.toLowerCase(),
      );
      if (!position) return { success: false, error: "No position found" };
      return { success: true, data: position };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to fetch position",
      };
    }
  })

  .get("/launches/:id/positions", async ({ params }) => {
    try {
      const positions = await getIndexedPositionsByLaunch(params.id);
      return { success: true, data: positions };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to fetch positions",
      };
    }
  })

  .get("/launches/:id/proof/:address", async ({ params }) => {
    // Get tankId from indexer, then look up proofs in DB
    const indexed = await getIndexedLaunch(params.id);
    if (!indexed) return { success: false, error: "Launch not found" };

    const launches = await db
      .select()
      .from(tankLaunches)
      .where(eq(tankLaunches.tankId, indexed.tankId));
    if (launches.length === 0)
      return { success: false, error: "Launch not found in DB" };

    const proofs = launches[0].proofs as Record<string, string[]> | null;
    const proof = proofs?.[params.address.toLowerCase()];
    if (!proof) return { success: false, error: "Address not in whitelist" };

    return {
      success: true,
      data: { proof, merkleRoot: launches[0].merkleRoot },
    };
  })

  // ============================================
  // Sovereign Submolt Endpoints (DB-backed)
  // ============================================

  .post(
    "/submolts/sovereign",
    async ({ body, headers }) => {
      const auth = await verifyAgent(headers);
      if (!auth.success) return { success: false, error: auth.error };

      const moltbook = getMoltbookClient();

      const existing = await db
        .select()
        .from(sovereignSubmolts)
        .where(eq(sovereignSubmolts.submoltId, body.submoltId));
      if (existing.length > 0) {
        return {
          success: false,
          error: "Sovereign Submolt already exists for this submolt",
        };
      }

      const moltbookSubmolt = await moltbook.getSubmolt(body.submoltId);

      const creatorAllocation = Math.min(
        body.creatorAllocation ?? DEFAULT_CONFIG.DEFAULT_CREATOR_ALLOCATION,
        DEFAULT_CONFIG.MAX_CREATOR_ALLOCATION,
      );

      const tokenAddress =
        "0x" +
        Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");
      const treasuryAddress =
        "0x" +
        Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");
      const totalSupply = "1000000000000000000000000";

      const [sovereignSubmolt] = await db
        .insert(sovereignSubmolts)
        .values({
          submoltId: body.submoltId,
          name: moltbookSubmolt?.name || body.tokenName,
          description:
            moltbookSubmolt?.description ||
            `Sovereign Submolt for ${body.submoltId}`,
          tokenName: body.tokenName,
          tokenSymbol: body.tokenSymbol,
          earlyAccessKarma:
            body.earlyAccessKarma ?? DEFAULT_CONFIG.DEFAULT_EARLY_ACCESS_KARMA,
          gatedChannelKarma:
            body.gatedChannelKarma ??
            DEFAULT_CONFIG.DEFAULT_GATED_CHANNEL_KARMA,
          creatorAllocation,
          creatorAgentId: auth.agent.id,
          treasuryAddress,
          tokenAddress,
          tokenSupply: totalSupply,
          tokenDeployed: true,
        }) 
        .returning();

      return {
        success: true,
        data: sovereignSubmolt,
        message: "Sovereign Submolt created with new token!",
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
    },
  )

  .get("/submolts/sovereign/:submoltId", async ({ params }) => {
    const rows = await db
      .select()
      .from(sovereignSubmolts)
      .where(eq(sovereignSubmolts.submoltId, params.submoltId));
    if (rows.length === 0) {
      return { success: false, error: "Sovereign Submolt not found" };
    }
    return { success: true, data: rows[0] };
  })

  .get("/submolts/sovereign", async () => {
    const rows = await db.select().from(sovereignSubmolts);
    return { success: true, data: rows };
  })

  .get("/stats", async () => {
    try {
      const indexerStats = await getIndexedGlobalStats();
      const rows = await db.select().from(sovereignSubmolts);
      const uniqueAgents = new Set(rows.map((r) => r.creatorAgentId));

      return {
        success: true,
        data: {
          totalSubmolts: rows.length,
          totalAgents: uniqueAgents.size,
          totalLaunches: indexerStats?.totalLaunches ?? 0,
          totalLaunched: indexerStats?.totalLaunched ?? 0,
          totalRaised: indexerStats?.totalRaised ?? "0",
          totalContributions: indexerStats?.totalContributions ?? 0,
        },
        source: "indexer",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Indexer unavailable",
      };
    }
  })

  // ============================================
  // Whitelist / Access Check Endpoints
  // ============================================

  .get("/submolts/sovereign/:submoltId/access/:agentId", async ({ params }) => {
    const moltbook = getMoltbookClient();
    const rows = await db
      .select()
      .from(sovereignSubmolts)
      .where(eq(sovereignSubmolts.submoltId, params.submoltId));

    if (rows.length === 0) {
      return { success: false, error: "Sovereign Submolt not found" };
    }

    const sovereignSubmolt = rows[0];
    const agent = await moltbook.getAgent(params.agentId);
    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const access = {
      agentName: agent.name,
      karma: agent.karma,
      canCreate: agent.karma >= DEFAULT_CONFIG.MIN_KARMA_TO_CREATE,
      hasEarlyAccess: agent.karma >= sovereignSubmolt.earlyAccessKarma,
      hasGatedChannelAccess: agent.karma >= sovereignSubmolt.gatedChannelKarma,
      isCreator: agent.name === sovereignSubmolt.creatorAgentId,
    };

    return { success: true, data: access };
  });

// Export handlers for Next.js
export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;

// Export app instance for Eden client
export { app };
