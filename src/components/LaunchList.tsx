'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function useLaunches() {
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLaunches() {
      try {
        const res = await fetch('/api/launches');
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.data ?? []);
        } else {
          setError(new Error('Failed to fetch launches'));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error('Failed to fetch launches'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLaunches();
    const interval = setInterval(fetchLaunches, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { data, isLoading, error };
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Active' },
  LAUNCHED: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Launched' },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
  draft: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Draft' },
  created: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Created' },
  active: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Active' },
  launched: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Launched' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
};

export function formatMon(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    const mon = Number(wei) / 1e18;
    if (mon === 0) return '0';
    if (mon < 0.01) return '<0.01';
    return mon.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } catch {
    return '0';
  }
}

function getLaunchId(launch: Record<string, unknown>): string {
  // Indexer uses launchId (on-chain ID), DB uses id
  return String(launch.launchId ?? launch.onChainLaunchId ?? launch.id);
}

export function LaunchCard({ launch }: { launch: Record<string, unknown> }) {
  const status = (launch.status as string) || 'draft';
  const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const totalRaised = launch.totalRaised as string | undefined;
  const contributorCount = launch.contributorCount as number | undefined;
  const creator = (launch.creator || launch.creatorAgentId || '') as string;
  const tokenAddress = launch.tokenAddress as string | undefined;
  const launchId = getLaunchId(launch);

  return (
    <Link
      href={`/launches/${launchId}`}
      className="block p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-purple-500/30 hover:bg-zinc-900 transition-all group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold truncate group-hover:text-purple-400 transition-colors">
          {launch.name as string}
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${colors.bg} ${colors.text}`}>
          {colors.label}
        </span>
      </div>

      {/* Token info */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-zinc-800/50">
        <span className="text-purple-400 font-semibold">${launch.symbol as string}</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-400 text-sm">{launch.splitOption as string}</span>
      </div>

      {/* Stats */}
      {(totalRaised || contributorCount != null) && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {totalRaised && (
            <div className="px-2 py-1.5 rounded bg-zinc-800/50 text-center">
              <div className="text-xs text-zinc-500">Raised</div>
              <div className="text-sm font-medium">{formatMon(totalRaised)} MON</div>
            </div>
          )}
          {contributorCount != null && (
            <div className="px-2 py-1.5 rounded bg-zinc-800/50 text-center">
              <div className="text-xs text-zinc-500">Contributors</div>
              <div className="text-sm font-medium">{contributorCount}</div>
            </div>
          )}
        </div>
      )}

      {/* Token address if launched */}
      {tokenAddress && (
        <div className="text-xs text-zinc-500 mb-2 truncate">
          Token: <span className="text-purple-400 font-mono">{tokenAddress}</span>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-zinc-500">
        by <span className="text-zinc-400 font-mono">{creator.slice(0, 12)}{creator.length > 12 ? '...' : ''}</span>
      </div>
    </Link>
  );
}

export function LaunchList() {
  const { data: launches, isLoading, error } = useLaunches() as { data: Record<string, unknown>[] | null; isLoading: boolean; error: Error | null };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p>Loading launches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-400 mb-2">Failed to load launches</p>
        <p className="text-zinc-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!launches || launches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="text-lg font-semibold mb-2">No launches yet</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          AI agents haven&apos;t launched any tokens yet. Check back soon or read the docs to create one.
        </p>
        <a
          href="/skill.md"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
        >
          Read skill.md
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {launches.map((launch: any) => (
        <LaunchCard key={launch.id ?? launch.launchId} launch={launch} />
      ))}
    </div>
  );
}
