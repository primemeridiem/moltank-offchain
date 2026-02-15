// On-chain contract read functions via viem
import { createPublicClient, http, formatEther, type Address, type Hex, decodeEventLog } from 'viem';
import { monadTestnet, MOLTTANK_ADDRESS, MOLTTANK_ABI } from './config';

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
});

/** Get on-chain launch data directly from MoltTank contract */
export async function getOnChainLaunch(launchId: number) {
  try {
    const result = await publicClient.readContract({
      address: MOLTTANK_ADDRESS,
      abi: MOLTTANK_ABI,
      functionName: 'getLaunch',
      args: [BigInt(launchId)],
    });

    const [creator, status, splitOption, token, totalRaised, totalTokensAllocated, launchTimestamp, privateRoundStart, privateRoundEnd] = result as [
      Address, number, number, Address, bigint, bigint, bigint, bigint, bigint
    ];

    return {
      creator,
      status, // 0=Active, 1=Launched, 2=Cancelled
      splitOption,
      token,
      totalRaised: formatEther(totalRaised),
      totalRaisedWei: totalRaised.toString(),
      totalTokensAllocated: totalTokensAllocated.toString(),
      launchTimestamp: Number(launchTimestamp),
      privateRoundStart: Number(privateRoundStart),
      privateRoundEnd: Number(privateRoundEnd),
    };
  } catch (e) {
    throw new Error(`Failed to read launch ${launchId}: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
}

/** Get total number of launches from contract */
export async function getOnChainLaunchCount(): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: MOLTTANK_ADDRESS,
      abi: MOLTTANK_ABI,
      functionName: 'launchCounter',
    });
    return Number(result);
  } catch {
    return 0;
  }
}

/** Get split details (pure function, no on-chain state) */
export async function getOnChainSplitDetails(splitOption: number) {
  const result = await publicClient.readContract({
    address: MOLTTANK_ADDRESS,
    abi: MOLTTANK_ABI,
    functionName: 'getSplitDetails',
    args: [splitOption],
  });

  const [privatePercent, publicPercent, hardCapMon, publicCurveMon] = result as [bigint, bigint, bigint, bigint];

  return {
    privatePercent: Number(privatePercent),
    publicPercent: Number(publicPercent),
    hardCapMon: formatEther(hardCapMon),
    publicCurveMon: formatEther(publicCurveMon),
  };
}

// TankCreated event ABI for decoding
const TANK_CREATED_EVENT = {
  type: 'event' as const,
  name: 'TankCreated',
  inputs: [
    { name: 'launchId', type: 'uint256', indexed: true },
    { name: 'creator', type: 'address', indexed: true },
    { name: 'tankId', type: 'string', indexed: false },
    { name: 'name', type: 'string', indexed: false },
    { name: 'symbol', type: 'string', indexed: false },
    { name: 'splitOption', type: 'uint8', indexed: false },
    { name: 'tgeUnlockBps', type: 'uint256', indexed: false },
    { name: 'vestingCliff', type: 'uint256', indexed: false },
    { name: 'vestingDuration', type: 'uint256', indexed: false },
  ],
};

/** Extract on-chain launch ID from a TX receipt */
export async function getOnChainLaunchIdFromTx(txHash: Hex): Promise<number | null> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: [TANK_CREATED_EVENT],
          data: log.data,
          topics: log.topics,
        });
        if (event.eventName === 'TankCreated') {
          return Number((event.args as { launchId: bigint }).launchId);
        }
      } catch {
        // Not a TankCreated event, skip
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Get hard cap for a split option */
export async function getOnChainHardCap(splitOption: number): Promise<string> {
  const result = await publicClient.readContract({
    address: MOLTTANK_ADDRESS,
    abi: MOLTTANK_ABI,
    functionName: 'getHardCap',
    args: [splitOption],
  });
  return formatEther(result as bigint);
}
