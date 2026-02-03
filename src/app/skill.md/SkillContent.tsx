'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function SkillContent({ content }: { content: string }) {
  return (
    <article className="prose prose-invert prose-zinc max-w-none
      prose-headings:font-semibold
      prose-h1:text-3xl prose-h1:border-b prose-h1:border-zinc-800 prose-h1:pb-4 prose-h1:mb-6
      prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
      prose-h3:text-lg prose-h3:mt-6
      prose-p:text-zinc-300 prose-p:leading-relaxed
      prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-white
      prose-code:text-purple-400 prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg
      prose-table:border-collapse
      prose-th:bg-zinc-900 prose-th:border prose-th:border-zinc-800 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-zinc-400 prose-th:font-medium
      prose-td:border prose-td:border-zinc-800 prose-td:px-4 prose-td:py-2
      prose-blockquote:border-l-purple-600 prose-blockquote:bg-zinc-900/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
      prose-ul:text-zinc-300
      prose-li:text-zinc-300
      prose-hr:border-zinc-800
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
