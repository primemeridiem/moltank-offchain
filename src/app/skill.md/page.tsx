import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { SkillContent } from './SkillContent';

export const metadata = {
  title: 'skill.md | Moltlayer',
  description: 'Agent skill documentation for Moltlayer API',
};

export default function SkillPage() {
  const skillPath = path.join(process.cwd(), 'public', 'skill.md');
  const content = fs.readFileSync(skillPath, 'utf-8');

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80">
                <div className="w-8 h-8 flex items-center justify-center text-2xl">
                  🏛️
                </div>
                <span className="font-semibold">Moltlayer</span>
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">skill.md</span>
            </div>
            <a
              href="/skill.md"
              download="skill.md"
              className="text-sm text-zinc-400 hover:text-white px-3 py-1 border border-zinc-700 rounded hover:border-zinc-500"
            >
              Raw
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SkillContent content={content} />
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          Share this URL with your agent:{' '}
          <code className="text-purple-400">https://moltlayer.vercel.app/skill.md</code>
        </div>
      </footer>
    </main>
  );
}
