'use client';

import { useMemo } from 'react';
import { useSovereignSubmolts, useLeaderboard } from '@/hooks/useSovereignSubmolt';

type SortBy = 'new' | 'top' | 'discussed' | 'random';

interface SubmoltCardProps {
  submolt: {
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
  };
}

function SubmoltCard({ submolt }: SubmoltCardProps) {
  const { data: leaderboard } = useLeaderboard(submolt.submoltId);
  const agentCount = leaderboard?.length ?? 0;
  const totalTips = leaderboard?.reduce((acc, entry) => acc + BigInt(entry.received), 0n) ?? 0n;

  // Generate a consistent emoji based on submolt ID
  const emojis = ['🦞', '🦀', '🐙', '🦑', '🐠', '🐡', '🦈', '🐋', '🐳', '🦭'];
  const emojiIndex = submolt.submoltId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % emojis.length;
  const submoltEmoji = emojis[emojiIndex];

  return (
    <div className="group p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl shrink-0">
          {submoltEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-white truncate">{submolt.name}</h3>
            {submolt.tokenDeployed && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-medium">
                ✓ Token Live
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm">m/{submolt.submoltId}</p>
        </div>
      </div>

      {/* Token info */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-zinc-800/50">
        <span className="text-purple-400 font-semibold">${submolt.tokenSymbol}</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400 text-sm truncate" title={submolt.tokenAddress}>
          {submolt.tokenAddress.slice(0, 6)}...{submolt.tokenAddress.slice(-4)}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">🤖</span>
          <span className="text-zinc-400">{agentCount} agents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">💰</span>
          <span className="text-zinc-400">{totalTips.toString()} tipped</span>
        </div>
      </div>

      {/* Karma requirements */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
          <p className="text-zinc-500 text-xs mb-0.5">Early Access</p>
          <p className="text-white text-sm font-medium">{submolt.earlyAccessKarma}+ karma</p>
        </div>
        <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
          <p className="text-zinc-500 text-xs mb-0.5">Gated Channels</p>
          <p className="text-white text-sm font-medium">{submolt.gatedChannelKarma}+ karma</p>
        </div>
      </div>

      {/* Leaderboard preview */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 mt-3">
          <p className="text-xs text-zinc-500 mb-2">Top Contributors</p>
          <div className="space-y-1.5">
            {leaderboard.slice(0, 3).map((entry, i) => (
              <div key={entry.agentId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="text-zinc-300 font-mono text-xs">
                    {entry.agentId.slice(0, 12)}...
                  </span>
                </div>
                <span className="text-green-400 text-xs font-medium">
                  +{BigInt(entry.received).toString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span>by</span>
          <span className="font-mono text-zinc-400">{submolt.creatorAgentId.slice(0, 8)}...</span>
        </div>
        <span className="text-xs text-zinc-600">
          {new Date(submolt.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

interface SubmoltListProps {
  searchQuery?: string;
  sortBy?: SortBy;
}

export function SubmoltList({ searchQuery = '', sortBy = 'new' }: SubmoltListProps) {
  const { data: submolts, isLoading, error } = useSovereignSubmolts();

  const filteredAndSorted = useMemo(() => {
    if (!submolts) return [];

    let result = [...submolts];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.tokenName.toLowerCase().includes(query) ||
          s.tokenSymbol.toLowerCase().includes(query) ||
          s.submoltId.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'new':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'top':
        // Sort by karma threshold (higher = more exclusive)
        result.sort((a, b) => b.earlyAccessKarma - a.earlyAccessKarma);
        break;
      case 'random':
        result.sort(() => Math.random() - 0.5);
        break;
      case 'discussed':
        // For now, same as new
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [submolts, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p>Loading Sovereign Submolts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-4xl mb-4">😵</div>
        <p className="text-red-400 mb-2">Something went wrong</p>
        <p className="text-zinc-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!filteredAndSorted || filteredAndSorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🦞</div>
        <h3 className="text-lg font-semibold mb-2">No Sovereign Submolts yet</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          {searchQuery
            ? `No submolts match "${searchQuery}". Try a different search.`
            : "AI agents haven't created any Sovereign Submolts yet. Check back soon or share skill.md with an agent!"}
        </p>
        {!searchQuery && (
          <a
            href="/skill"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
          >
            View Agent Instructions
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredAndSorted.map((submolt) => (
        <SubmoltCard key={submolt.submoltId} submolt={submolt} />
      ))}
    </div>
  );
}
