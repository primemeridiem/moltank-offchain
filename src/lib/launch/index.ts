import { encodeFunctionData, parseEther } from 'viem';
import { MOLTTANK_ADDRESS, MOLTTANK_ABI, SPLIT_OPTIONS, VESTING_PRESETS } from '@/lib/contracts/config';
import { generateMerkleTree } from '@/lib/merkle';

export type SplitOption = keyof typeof SPLIT_OPTIONS;
export type VestingPreset = keyof typeof VESTING_PRESETS;

export interface CreateLaunchParams {
  tankId: string;
  name: string;
  symbol: string;
  tokenURI: string;
  whitelist: string[];
  minContributionMon: string; // in MON (e.g. "1")
  maxContributionMon: string; // in MON (e.g. "1000")
  privateRoundStart: number;  // unix timestamp
  privateRoundEnd: number;    // unix timestamp
  splitOption: SplitOption;
  treasuryCapMon: string;     // in MON ("0" for no treasury)
  treasuryAddress: string;    // "0x0000..." for no treasury
  vestingPreset: VestingPreset;
}

export function buildCreateLaunchTx(params: CreateLaunchParams) {
  // Generate merkle tree from whitelist
  const { root, proofs } = generateMerkleTree(params.whitelist);

  const data = encodeFunctionData({
    abi: MOLTTANK_ABI,
    functionName: 'createLaunchWithPreset',
    args: [
      [params.tankId, params.name, params.symbol, params.tokenURI] as readonly [string, string, string, string],
      root,
      [parseEther(params.minContributionMon), parseEther(params.maxContributionMon)] as readonly [bigint, bigint],
      [BigInt(params.privateRoundStart), BigInt(params.privateRoundEnd)] as readonly [bigint, bigint],
      SPLIT_OPTIONS[params.splitOption],
      parseEther(params.treasuryCapMon),
      params.treasuryAddress as `0x${string}`,
      VESTING_PRESETS[params.vestingPreset],
    ],
  });

  // Convert proofs Map to serializable object
  const proofsObj: Record<string, string[]> = {};
  proofs.forEach((proof, addr) => {
    proofsObj[addr] = proof;
  });

  return {
    tx: {
      to: MOLTTANK_ADDRESS,
      data,
      value: '0',
    },
    merkleRoot: root,
    proofs: proofsObj,
  };
}

export function buildContributeTx(launchId: number, merkleProof: `0x${string}`[], amountMon: string) {
  const data = encodeFunctionData({
    abi: MOLTTANK_ABI,
    functionName: 'contribute',
    args: [BigInt(launchId), merkleProof],
  });

  return {
    to: MOLTTANK_ADDRESS,
    data,
    value: parseEther(amountMon).toString(),
  };
}

export function buildLaunchTokenTx(launchId: number) {
  const data = encodeFunctionData({
    abi: MOLTTANK_ABI,
    functionName: 'launchToken',
    args: [BigInt(launchId)],
  });

  return {
    to: MOLTTANK_ADDRESS,
    data,
    value: '0',
  };
}

export function buildClaimTx(launchId: number) {
  const data = encodeFunctionData({
    abi: MOLTTANK_ABI,
    functionName: 'claim',
    args: [BigInt(launchId)],
  });

  return {
    to: MOLTTANK_ADDRESS,
    data,
    value: '0',
  };
}
