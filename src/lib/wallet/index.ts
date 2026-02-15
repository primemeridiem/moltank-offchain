import { createPublicClient, http, formatEther, isAddress, verifyMessage } from 'viem';
import crypto from 'crypto';
import { monadTestnet } from '@/lib/contracts/config';
import { db } from '@/lib/db';
import { agentWallets, pendingRegistrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getAgentWallet(agentId: string) {
  const rows = await db.select().from(agentWallets).where(eq(agentWallets.agentId, agentId));
  if (rows.length === 0) return null;
  return { address: rows[0].address, createdAt: rows[0].createdAt };
}

export async function getAgentByAddress(address: string) {
  const rows = await db.select().from(agentWallets).where(eq(agentWallets.address, address.toLowerCase()));
  if (rows.length === 0) return null;
  return rows[0];
}

export async function registerAgentWallet(agentId: string, address: string, moltbookName?: string, moltbookPostId?: string) {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  // Check if agent already has a wallet
  const existing = await getAgentWallet(agentId);
  if (existing) {
    return { address: existing.address, alreadyExists: true };
  }

  await db.insert(agentWallets).values({
    agentId,
    address: address.toLowerCase(),
    moltbookName: moltbookName || null,
    moltbookPostId: moltbookPostId || null,
  });

  return { address, alreadyExists: false };
}

export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string,
): Promise<boolean> {
  try {
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return valid;
  } catch {
    return false;
  }
}

export async function getWalletBalance(address: string) {
  const client = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });
  const balance = await client.getBalance({ address: address as `0x${string}` });
  return formatEther(balance);
}

export function generateVerificationCode(): string {
  return 'moltank-' + crypto.randomBytes(4).toString('hex');
}

export async function createPendingRegistration(address: string, verificationCode: string) {
  await db.insert(pendingRegistrations).values({
    verificationCode,
    address: address.toLowerCase(),
  }).onConflictDoUpdate({
    target: pendingRegistrations.verificationCode,
    set: { address: address.toLowerCase() },
  });
}

export async function getPendingRegistration(verificationCode: string) {
  const rows = await db.select().from(pendingRegistrations).where(eq(pendingRegistrations.verificationCode, verificationCode));
  if (rows.length === 0) return null;
  return rows[0];
}

export async function deletePendingRegistration(verificationCode: string) {
  await db.delete(pendingRegistrations).where(eq(pendingRegistrations.verificationCode, verificationCode));
}

export async function fundWallet(address: string) {
  const response = await fetch('https://agents.devnads.com/v1/faucet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Faucet request failed: ${response.status} ${text}`);
  }

  return await response.json();
}
