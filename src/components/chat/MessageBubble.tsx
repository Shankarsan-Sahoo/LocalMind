import { type Message } from '../../types';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import { cn } from '../../utils/cn';
import { Copy } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "w-full flex py-6 px-4 md:px-0 group",
      isUser ? "bg-transparent" : "bg-gray-50/50 dark:bg-gray-800/20"
    )}>
      <div className="max-w-3xl mx-auto w-full flex gap-4 md:gap-6">
        <div className={cn(
          "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm",
          isUser ? "bg-blue-600" : "bg-emerald-600"
        )}>
          {isUser ? "U" : "AI"}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
            {isUser ? "You" : "LocalMind"}
            {isStreaming && <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </span>}
          </div>
          
          <MarkdownRenderer content={message.content} />
          
          {/* Message Actions */}
          {!isUser && !isStreaming && (
            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
