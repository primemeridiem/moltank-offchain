'use client';

import { useState } from 'react';
import { useCreateSovereignSubmolt } from '@/hooks/useSovereignSubmolt';

export function CreateSubmoltForm() {
  const [formData, setFormData] = useState({
    submoltId: '',
    tokenName: '',
    tokenSymbol: '',
    earlyAccessKarma: 50,
    gatedChannelKarma: 25,
    creatorAllocation: 10,
  });

  const createMutation = useCreateSovereignSubmolt();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In production, get this from Moltbook auth flow
    const identityToken = 'mock-identity-token';

    try {
      await createMutation.mutateAsync({
        ...formData,
        identityToken,
      });
      // Reset form
      setFormData({
        submoltId: '',
        tokenName: '',
        tokenSymbol: '',
        earlyAccessKarma: 50,
        gatedChannelKarma: 25,
        creatorAllocation: 10,
      });
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-zinc-900 rounded-lg">
      <h2 className="text-xl font-bold text-white">Create Sovereign Submolt</h2>
      <p className="text-zinc-400 text-sm">Requires 10+ karma on Moltbook</p>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Submolt ID (from Moltbook)
        </label>
        <input
          type="text"
          value={formData.submoltId}
          onChange={(e) => setFormData({ ...formData, submoltId: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
          placeholder="e.g., crypto-research"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Token Name
          </label>
          <input
            type="text"
            value={formData.tokenName}
            onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            placeholder="e.g., Research Token"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Token Symbol
          </label>
          <input
            type="text"
            value={formData.tokenSymbol}
            onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            placeholder="e.g., RSC"
            maxLength={6}
            required
          />
        </div>
      </div>

      <div className="border-t border-zinc-700 pt-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Karma Thresholds (set once)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Early Access Karma
            </label>
            <input
              type="number"
              value={formData.earlyAccessKarma}
              onChange={(e) => setFormData({ ...formData, earlyAccessKarma: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Gated Channel Karma
            </label>
            <input
              type="number"
              value={formData.gatedChannelKarma}
              onChange={(e) => setFormData({ ...formData, gatedChannelKarma: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
              min={0}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Creator Allocation: {formData.creatorAllocation}%
        </label>
        <input
          type="range"
          value={formData.creatorAllocation}
          onChange={(e) => setFormData({ ...formData, creatorAllocation: parseInt(e.target.value) })}
          className="w-full"
          min={0}
          max={20}
        />
        <p className="text-xs text-zinc-500">Max 20%</p>
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
      >
        {createMutation.isPending ? 'Creating...' : 'Create Sovereign Submolt'}
      </button>

      {createMutation.isError && (
        <p className="text-red-400 text-sm">{createMutation.error.message}</p>
      )}

      {createMutation.isSuccess && (
        <p className="text-green-400 text-sm">Sovereign Submolt created successfully!</p>
      )}
    </form>
  );
}
