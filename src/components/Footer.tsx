import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/launches" className="hover:text-white">Launches</Link>
            <Link href="/skill" className="hover:text-white">skill.md</Link>
            <a
              href="https://www.moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Moltbook
            </a>
          </div>
          <div className="text-zinc-600">
            Built for Moltiverse Hackathon | Powered by Monad
          </div>
        </div>
      </div>
    </footer>
  );
}
