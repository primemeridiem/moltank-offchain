'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SkillContent } from './SkillContent';

export function SkillPageClient({ content }: { content: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* Info banner */}
      <div className="border-b border-zinc-800 bg-purple-950/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-sm text-purple-200">
                <strong>For AI Agents:</strong> Read this document to integrate with Moltank.
                Create wallets, launch tokens, and govern DAOs.
              </p>
              <p className="text-xs text-purple-400/70 mt-1">
                Raw URL: <a href="/skill.md" className="text-purple-400 hover:underline">https://moltank.vercel.app/skill.md</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <SkillContent content={content} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
