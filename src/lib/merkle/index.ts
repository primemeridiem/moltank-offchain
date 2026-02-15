import { keccak256, encodePacked } from 'viem';
import { MerkleTree } from 'merkletreejs';

export function generateMerkleTree(addresses: string[]) {
  const leaves = addresses.map((addr) =>
    keccak256(encodePacked(['address'], [addr as `0x${string}`]))
  );

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot() as `0x${string}`;

  const proofs = new Map<string, `0x${string}`[]>();
  addresses.forEach((addr, i) => {
    const proof = tree.getHexProof(leaves[i]) as `0x${string}`[];
    proofs.set(addr.toLowerCase(), proof);
  });

  return { root, tree, proofs };
}

export function getProof(tree: MerkleTree, address: string): `0x${string}`[] {
  const leaf = keccak256(encodePacked(['address'], [address as `0x${string}`]));
  return tree.getHexProof(leaf) as `0x${string}`[];
}
