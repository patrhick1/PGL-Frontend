import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string | null | undefined;
  className?: string;
  prose?: boolean;
}

export function MarkdownRenderer({ content, className, prose = true }: MarkdownRendererProps) {
  if (!content) return null;

  const proseClasses = prose 
    ? "prose prose-slate max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80"
    : "";

  return (
    <div className={cn(proseClasses, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom rendering for specific elements if needed
        h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold mb-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>,
        li: ({ children }) => <li className="ml-4">{children}</li>,
        p: ({ children }) => <p className="mb-4">{children}</p>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-gray-600">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 transition-colors"
          >
            {children}
          </a>
        ),
        code: ({ inline, children }) => 
          inline ? (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
              <code className="text-sm font-mono">{children}</code>
            </pre>
          ),
        hr: () => <hr className="my-6 border-gray-300" />,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}