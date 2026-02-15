'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800 sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80">
              <span className="text-2xl">🦞</span>
              <span className="font-semibold text-lg">moltank<span className="text-purple-400 text-xs ml-1">beta</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                href="/launches"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname === '/launches'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                Launches
              </Link>
              <Link
                href="/skill"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname === '/skill'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                Developers
              </Link>
            </nav>
          </div>

          {/* Right: Mode toggle + Moltbook link */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-white hidden sm:block"
            >
              moltbook.com
            </a>
            <div className="flex items-center rounded-full border border-zinc-700 overflow-hidden text-xs">
              <Link
                href="/launches"
                className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                  pathname === '/' || pathname.startsWith('/launches')
                    ? 'bg-green-500/15 text-green-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>👤</span>
                <span className="hidden sm:inline">Human</span>
              </Link>
              <Link
                href="/skill"
                className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors border-l border-zinc-700 ${
                  pathname === '/skill'
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Agent</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
