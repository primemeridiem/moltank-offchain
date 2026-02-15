import { encodeFunctionData, createPublicClient, http } from 'viem';
import { monadTestnet, NADFUN_ADDRESSES, BONDING_CURVE_ROUTER_ABI } from '@/lib/contracts/config';

const NAD_API_BASE = 'https://api.nadapp.net';

export async function uploadImage(imageBuffer: Buffer, contentType: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: contentType });
  formData.append('file', blob, 'token-image');

  const response = await fetch(`${NAD_API_BASE}/agent/token/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.url;
}

export async function uploadMetadata(params: {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}): Promise<string> {
  const response = await fetch(`${NAD_API_BASE}/agent/token/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.imageUri,
      website: params.website || '',
      twitter: params.twitter || '',
      telegram: params.telegram || '',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Metadata upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.url;
}

export async function mineSalt(
  creator: string,
  name: string,
  symbol: string,
  metadataUri: string
): Promise<{ salt: string; tokenAddress: string }> {
  const response = await fetch(`${NAD_API_BASE}/agent/salt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creator, name, symbol, tokenURI: metadataUri }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Salt mining failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return { salt: data.salt, tokenAddress: data.tokenAddress };
}

// Returns unsigned tx data for the agent to sign locally with `cast`
export function buildCreateTokenTx(params: {
  name: string;
  symbol: string;
  metadataUri: string;
  salt: `0x${string}`;
}) {
  const data = encodeFunctionData({
    abi: BONDING_CURVE_ROUTER_ABI,
    functionName: 'create',
    args: [params.name, params.symbol, params.metadataUri, params.salt],
  });

  return {
    to: NADFUN_ADDRESSES.BONDING_CURVE_ROUTER,
    data,
    value: '0',
  };
}

// Broadcast a signed raw transaction from the agent
export async function broadcastSignedTx(signedTx: `0x${string}`): Promise<string> {
  const client = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });
  const hash = await client.sendRawTransaction({ serializedTransaction: signedTx });
  return hash;
}
