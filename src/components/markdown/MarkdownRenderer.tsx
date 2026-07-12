import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CodeBlock = ({ _node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group rounded-md overflow-hidden my-4 bg-[#1E1E1E]">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs font-mono border-b border-gray-700">
          <span>{match[1]}</span>
          <button 
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }
  
  return (
    <code className={`${className} bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>
      {children}
    </code>
  );
};

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
