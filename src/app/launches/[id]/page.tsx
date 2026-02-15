'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { STATUS_COLORS, formatMon } from '@/components/LaunchList';

interface LaunchDetail {
  id: string | number;
  launchId?: string;
  tankId?: string;
  creator?: string;
  creatorAgentId?: string;
  name: string;
  symbol: string;
  splitOption: string;
  status: string;
  totalRaised?: string;
  contributorCount?: number;
  tokenAddress?: string | null;
  tokensAllocated?: string | null;
  treasuryAmount?: string | null;
  tgeUnlockBps?: string;
  vestingCliff?: string;
  vestingDuration?: string;
  merkleRoot?: string;
  minContribution?: string;
  maxContribution?: string;
  privateRoundStart?: number;
  privateRoundEnd?: number;
  treasuryCap?: string;
  treasuryAddress?: string;
  vestingPreset?: string;
  tokenUri?: string;
  txHash?: string;
  createdAtTimestamp?: number;
  createdAt?: string;
  launchedAtTimestamp?: number | null;
  onChainLaunchId?: number;
}

interface Contribution {
  id: string;
  contributor: string;
  amount: string;
  timestamp: number;
  txHash: string;
}

interface Position {
  id: string;
  launchId: string;
  user: string;
  totalContributed: string;
  totalClaimed: string;
  totalRefunded: string;
}

function formatAddress(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function formatDuration(seconds: number | string): string {
  const s = Number(seconds);
  if (s === 0) return 'None';
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
      {colors.label}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function LaunchDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [launch, setLaunch] = useState<LaunchDetail | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/launches/${id}`).then((r) => r.json()),
      fetch(`/api/launches/${id}/contributions`).then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`/api/launches/${id}/positions`).then((r) => r.json()).catch(() => ({ success: false })),
    ])
      .then(([launchRes, contribRes, posRes]) => {
        if (!launchRes.success) {
          setError(launchRes.error || 'Launch not found');
          return;
        }
        setLaunch(launchRes.data);
        if (contribRes.success) {
          setContributions(contribRes.data ?? []);
        }
        if (posRes.success) {
          setPositions(posRes.data ?? []);
        }
      })
      .catch(() => setError('Failed to load launch'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-zinc-400">Loading launch...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !launch) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">Launch not found</h2>
            <p className="text-zinc-400 text-sm mb-6">{error || 'This launch does not exist.'}</p>
            <Link
              href="/launches"
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
            >
              Back to launches
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const creator = launch.creator || launch.creatorAgentId || '';
  const status = launch.status || 'draft';
  const totalRaised = launch.totalRaised || '0';
  const now = Math.floor(Date.now() / 1000);
  const roundStart = launch.privateRoundStart;
  const roundEnd = launch.privateRoundEnd;

  let roundStatus = '';
  if (roundStart && roundEnd) {
    if (now < roundStart) roundStatus = 'Not started';
    else if (now < roundEnd) roundStatus = 'In progress';
    else roundStatus = 'Ended';
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/launches" className="hover:text-white transition-colors">Launches</Link>
          <span>/</span>
          <span className="text-zinc-300">{launch.name}</span>
        </div>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{launch.name}</h1>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="text-purple-400 font-semibold">${launch.symbol}</span>
              <span className="text-zinc-600">|</span>
              <span>{launch.splitOption}</span>
              {launch.vestingPreset && (
                <>
                  <span className="text-zinc-600">|</span>
                  <span>{launch.vestingPreset}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Total Raised"
            value={`${formatMon(totalRaised)} MON`}
          />
          <StatCard
            label="Contributors"
            value={String(launch.contributorCount ?? contributions.length)}
          />
          <StatCard
            label="Private Round"
            value={roundStatus || 'N/A'}
            sub={roundStart && roundEnd
              ? `${formatTimestamp(roundStart)} → ${formatTimestamp(roundEnd)}`
              : undefined}
          />
          <StatCard
            label="Status"
            value={STATUS_COLORS[status]?.label || status}
          />
        </div>

        {/* Details sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Launch info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="font-semibold mb-4 text-sm text-zinc-300">Launch Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Creator</dt>
                <dd className="font-mono text-zinc-300">{formatAddress(creator)}</dd>
              </div>
              {launch.tankId && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Tank ID</dt>
                  <dd className="text-zinc-300">{launch.tankId}</dd>
                </div>
              )}
              {launch.minContribution && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Min Contribution</dt>
                  <dd className="text-zinc-300">{launch.minContribution} MON</dd>
                </div>
              )}
              {launch.maxContribution && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Max Contribution</dt>
                  <dd className="text-zinc-300">{launch.maxContribution} MON</dd>
                </div>
              )}
              {launch.treasuryCap && launch.treasuryCap !== '0' && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Treasury Cap</dt>
                  <dd className="text-zinc-300">{launch.treasuryCap} MON</dd>
                </div>
              )}
              {launch.treasuryAddress && launch.treasuryAddress !== '0x0000000000000000000000000000000000000000' && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Treasury</dt>
                  <dd className="font-mono text-zinc-300">{formatAddress(launch.treasuryAddress)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Vesting / Token info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="font-semibold mb-4 text-sm text-zinc-300">Token & Vesting</h3>
            <dl className="space-y-3 text-sm">
              {launch.tokenAddress && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Token Address</dt>
                  <dd className="font-mono text-purple-400">{formatAddress(launch.tokenAddress)}</dd>
                </div>
              )}
              {launch.tgeUnlockBps && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">TGE Unlock</dt>
                  <dd className="text-zinc-300">{Number(launch.tgeUnlockBps) / 100}%</dd>
                </div>
              )}
              {launch.vestingCliff && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Cliff</dt>
                  <dd className="text-zinc-300">{formatDuration(launch.vestingCliff)}</dd>
                </div>
              )}
              {launch.vestingDuration && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Vesting Duration</dt>
                  <dd className="text-zinc-300">{formatDuration(launch.vestingDuration)}</dd>
                </div>
              )}
              {launch.tokensAllocated && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Tokens Allocated</dt>
                  <dd className="text-zinc-300">{formatMon(launch.tokensAllocated)}</dd>
                </div>
              )}
              {launch.treasuryAmount && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Treasury Amount</dt>
                  <dd className="text-zinc-300">{formatMon(launch.treasuryAmount)} MON</dd>
                </div>
              )}
              {launch.vestingPreset && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Vesting Preset</dt>
                  <dd className="text-zinc-300">{launch.vestingPreset}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Transaction info */}
        {launch.txHash && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
            <h3 className="font-semibold mb-3 text-sm text-zinc-300">Transaction</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Tx Hash:</span>
              <span className="font-mono text-purple-400 break-all">{launch.txHash}</span>
            </div>
            {(launch.createdAtTimestamp || launch.createdAt) && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="text-zinc-500">Created:</span>
                <span className="text-zinc-300">
                  {launch.createdAtTimestamp
                    ? formatTimestamp(launch.createdAtTimestamp)
                    : launch.createdAt}
                </span>
              </div>
            )}
            {launch.launchedAtTimestamp && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="text-zinc-500">Launched:</span>
                <span className="text-zinc-300">{formatTimestamp(launch.launchedAtTimestamp)}</span>
              </div>
            )}
          </div>
        )}

        {/* Participants — contributed / claimed / refunded */}
        {positions.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
            <h3 className="font-semibold mb-4 text-sm text-zinc-300">
              Participants ({positions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="pb-2 pr-4">Address</th>
                    <th className="pb-2 pr-4">Contributed</th>
                    <th className="pb-2 pr-4">Claimed</th>
                    <th className="pb-2 pr-4">Refunded</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {positions.map((p) => {
                    const contributed = BigInt(p.totalContributed || '0');
                    const claimed = BigInt(p.totalClaimed || '0');
                    const refunded = BigInt(p.totalRefunded || '0');
                    const hasClaimed = claimed > 0n;
                    const hasRefunded = refunded > 0n;
                    return (
                      <tr key={p.id} className="text-zinc-300">
                        <td className="py-2.5 pr-4 font-mono">{formatAddress(p.user)}</td>
                        <td className="py-2.5 pr-4">{formatMon(p.totalContributed)} MON</td>
                        <td className="py-2.5 pr-4">
                          {hasClaimed
                            ? <span className="text-green-400">{formatMon(p.totalClaimed)}</span>
                            : <span className="text-zinc-500">—</span>
                          }
                        </td>
                        <td className="py-2.5 pr-4">
                          {hasRefunded
                            ? <span className="text-yellow-400">{formatMon(p.totalRefunded)} MON</span>
                            : <span className="text-zinc-500">—</span>
                          }
                        </td>
                        <td className="py-2.5">
                          {hasClaimed
                            ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400">Claimed</span>
                            : contributed > 0n
                              ? <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400">Contributed</span>
                              : <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-500/10 text-zinc-400">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contributions table */}
        {contributions.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="font-semibold mb-4 text-sm text-zinc-300">
              Contributions ({contributions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="pb-2 pr-4">Contributor</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {contributions.map((c) => (
                    <tr key={c.id} className="text-zinc-300">
                      <td className="py-2.5 pr-4 font-mono">{formatAddress(c.contributor)}</td>
                      <td className="py-2.5 pr-4">{formatMon(c.amount)} MON</td>
                      <td className="py-2.5 pr-4 text-zinc-500">{formatTimestamp(c.timestamp)}</td>
                      <td className="py-2.5 font-mono text-purple-400 text-xs">{formatAddress(c.txHash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
