'use client';

import { useSovereignSubmolts, useLeaderboard } from '@/hooks/useSovereignSubmolt';
import type { SovereignSubmolt } from '@/lib/services/api';

function SubmoltCard({ submolt }: { submolt: SovereignSubmolt }) {
  const { data: leaderboard } = useLeaderboard(submolt.submoltId);

  return (
    <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{submolt.tokenName}</h3>
          <p className="text-zinc-400 text-sm">m/{submolt.submoltId}</p>
        </div>
        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-sm rounded">
          ${submolt.tokenSymbol}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-zinc-500">Early Access</p>
          <p className="text-white">{submolt.earlyAccessKarma}+ karma</p>
        </div>
        <div>
          <p className="text-zinc-500">Gated Channels</p>
          <p className="text-white">{submolt.gatedChannelKarma}+ karma</p>
        </div>
        <div>
          <p className="text-zinc-500">Creator Allocation</p>
          <p className="text-white">{submolt.creatorAllocation}%</p>
        </div>
        <div>
          <p className="text-zinc-500">Created</p>
          <p className="text-white">{new Date(submolt.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {leaderboard && leaderboard.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Top Contributors</h4>
          <div className="space-y-2">
            {leaderboard.slice(0, 3).map((entry, i) => (
              <div key={entry.agentId} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  {i + 1}. {entry.agentId.slice(0, 8)}...
                </span>
                <span className="text-green-400">
                  +{BigInt(entry.received).toString()} received
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SubmoltList() {
  const { data: submolts, isLoading, error } = useSovereignSubmolts();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-zinc-400">
        Loading Sovereign Submolts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        Error: {error.message}
      </div>
    );
  }

  if (!submolts || submolts.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        No Sovereign Submolts yet. Create the first one!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {submolts.map((submolt) => (
        <SubmoltCard key={submolt.submoltId} submolt={submolt} />
      ))}
    </div>
  );
}
