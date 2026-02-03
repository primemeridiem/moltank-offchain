'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SovereignSubmolt, Tip, LeaderboardEntry, AccessInfo } from '@/lib/services/api';

const API_BASE = '/api';

// Fetch a single Sovereign Submolt
export function useSovereignSubmolt(submoltId: string) {
  return useQuery({
    queryKey: ['sovereignSubmolt', submoltId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/submolts/sovereign/${submoltId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sovereign submolt');
      }
      return data.data as SovereignSubmolt;
    },
    enabled: !!submoltId,
  });
}

// Fetch all Sovereign Submolts
export function useSovereignSubmolts() {
  return useQuery({
    queryKey: ['sovereignSubmolts'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/submolts/sovereign`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sovereign submolts');
      }
      return data.data as SovereignSubmolt[];
    },
  });
}

// Create a new Sovereign Submolt
export function useCreateSovereignSubmolt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      submoltId: string;
      tokenName: string;
      tokenSymbol: string;
      earlyAccessKarma?: number;
      gatedChannelKarma?: number;
      creatorAllocation?: number;
      identityToken: string;
    }) => {
      const { identityToken, ...body } = params;
      const response = await fetch(`${API_BASE}/submolts/sovereign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-moltbook-identity': identityToken,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create sovereign submolt');
      }
      return data.data as SovereignSubmolt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sovereignSubmolts'] });
    },
  });
}

// Check agent access
export function useAgentAccess(submoltId: string, agentId: string) {
  return useQuery({
    queryKey: ['agentAccess', submoltId, agentId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/submolts/sovereign/${submoltId}/access/${agentId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to check access');
      }
      return data.data as AccessInfo;
    },
    enabled: !!submoltId && !!agentId,
  });
}

// Fetch tips for a submolt
export function useTips(submoltId: string, agentId?: string) {
  return useQuery({
    queryKey: ['tips', submoltId, agentId],
    queryFn: async () => {
      const url = new URL(`${API_BASE}/submolts/sovereign/${submoltId}/tips`, window.location.origin);
      if (agentId) {
        url.searchParams.set('agentId', agentId);
      }
      const response = await fetch(url);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tips');
      }
      return data.data as Tip[];
    },
    enabled: !!submoltId,
  });
}

// Send a tip
export function useSendTip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      submoltId: string;
      toAgentId: string;
      amount: string;
      contentId?: string;
      contentType?: 'post' | 'comment';
      identityToken: string;
    }) => {
      const { submoltId, identityToken, ...body } = params;
      const response = await fetch(`${API_BASE}/submolts/sovereign/${submoltId}/tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-moltbook-identity': identityToken,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send tip');
      }
      return data.data as Tip;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tips', variables.submoltId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', variables.submoltId] });
    },
  });
}

// Fetch leaderboard
export function useLeaderboard(submoltId: string) {
  return useQuery({
    queryKey: ['leaderboard', submoltId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/submolts/sovereign/${submoltId}/leaderboard`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }
      return data.data as LeaderboardEntry[];
    },
    enabled: !!submoltId,
  });
}
