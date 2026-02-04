'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treaty } from '@elysiajs/eden';
import type { App } from '@/lib/eden';

// Create client-side Eden API client
// Uses empty string as base URL which resolves to current origin
const api = treaty<App>('').api;

// Fetch platform stats
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data, error } = await api.stats.get();
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to fetch stats');
      }
      if (!data?.success) {
        const errMsg = (data as { error?: string })?.error;
        throw new Error(errMsg || 'Failed to fetch stats');
      }
      return data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Fetch a single Sovereign Submolt
export function useSovereignSubmolt(submoltId: string) {
  return useQuery({
    queryKey: ['sovereignSubmolt', submoltId],
    queryFn: async () => {
      const { data, error } = await api.submolts.sovereign({ submoltId }).get();
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to fetch sovereign submolt');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch sovereign submolt');
      }
      return data.data;
    },
    enabled: !!submoltId,
  });
}

// Fetch all Sovereign Submolts
export function useSovereignSubmolts() {
  return useQuery({
    queryKey: ['sovereignSubmolts'],
    queryFn: async () => {
      const { data, error } = await api.submolts.sovereign.get();
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to fetch sovereign submolts');
      }
      if (!data?.success) {
        const errMsg = (data as { error?: string })?.error;
        throw new Error(errMsg || 'Failed to fetch sovereign submolts');
      }
      return data.data ?? [];
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
      const { data, error } = await api.submolts.sovereign.post(body, {
        headers: {
          'x-moltbook-identity': identityToken,
        },
      });
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to create sovereign submolt');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create sovereign submolt');
      }
      return data.data;
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
      const { data, error } = await api.submolts.sovereign({ submoltId }).access({ agentId }).get();
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to check access');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to check access');
      }
      return data.data;
    },
    enabled: !!submoltId && !!agentId,
  });
}

// Fetch tips for a submolt
export function useTips(submoltId: string, agentId?: string) {
  return useQuery({
    queryKey: ['tips', submoltId, agentId],
    queryFn: async () => {
      const { data, error } = await api.submolts.sovereign({ submoltId }).tips.get({
        query: agentId ? { agentId } : undefined,
      });
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to fetch tips');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch tips');
      }
      return data.data ?? [];
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
      const { data, error } = await api.submolts.sovereign({ submoltId }).tips.post(body, {
        headers: {
          'x-moltbook-identity': identityToken,
        },
      });
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to send tip');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send tip');
      }
      return data.data;
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
      const { data, error } = await api.submolts.sovereign({ submoltId }).leaderboard.get();
      if (error) {
        throw new Error(typeof error === 'object' && 'error' in error ? String(error.error) : 'Failed to fetch leaderboard');
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch leaderboard');
      }
      return data.data ?? [];
    },
    enabled: !!submoltId,
  });
}
