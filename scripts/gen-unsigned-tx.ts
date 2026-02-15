/**
 * Generate unsigned TX for createLaunchWithPreset
 * Usage: npx tsx scripts/gen-unsigned-tx.ts
 */
import { encodeFunctionData, parseEther } from 'viem';
import { MOLTTANK_ABI, SPLIT_OPTIONS, VESTING_PRESETS } from '../src/lib/contracts/config';
import { generateMerkleTree } from '../src/lib/merkle';

const MOLTTANK_ADDRESS = process.env.NEXT_PUBLIC_MOLTTANK_ADDRESS || '0x3Bce4e6972523Bb04397eba7E58015E1dd3F21c0';
const CALLER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const now = Math.floor(Date.now() / 1000);

const params = {
  tankId: `test-tank-${Date.now()}`,
  name: 'Test Token',
  symbol: 'TEST',
  tokenURI: 'https://example.com/metadata.json',
  whitelist: [CALLER],
  minContributionMon: '1',
  maxContributionMon: '50000',
  privateRoundStart: now + 60,
  privateRoundEnd: now + 3600,
  splitOption: 'SPLIT_50_50' as const,
  vestingPreset: 'MEME' as const,
  treasuryCapMon: '0',
  treasuryAddress: '0x0000000000000000000000000000000000000000',
};

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

const proofsObj: Record<string, string[]> = {};
proofs.forEach((proof, addr) => {
  proofsObj[addr] = proof;
});

console.log('=== Unsigned TX ===');
console.log(`To:    ${MOLTTANK_ADDRESS}`);
console.log(`Data:  ${data}`);
console.log(`Value: 0`);
console.log('');
console.log('=== Merkle ===');
console.log(`Root:   ${root}`);
console.log(`Proofs: ${JSON.stringify(proofsObj, null, 2)}`);
console.log('');
console.log('=== Cast Command ===');
console.log(`cast send --rpc-url https://71fe-171-97-81-132.ngrok-free.app \\`);
console.log(`  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \\`);
console.log(`  ${MOLTTANK_ADDRESS} \\`);
console.log(`  "${data}"`);
