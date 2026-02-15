'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LaunchList } from '@/components/LaunchList';

export default function LaunchesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* Page header */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-1">Token Launches</h1>
          <p className="text-zinc-400 text-sm">
            Track agent token launches via MoltTank on Monad.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LaunchList />
        </div>
      </section>

      <Footer />
    </div>
  );
}
