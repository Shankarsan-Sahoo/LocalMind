import { ArrowUp, Square } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isGenerating, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isGenerating && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 relative">
      <div className="relative flex items-end bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-blue-500 transition-all p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Please wait..." : "Message LocalMind..."}
          className="w-full max-h-[200px] bg-transparent resize-none overflow-y-auto px-3 py-2 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
          rows={1}
        />
        
        {isGenerating ? (
          <button
            onClick={onStop}
            className="p-2 mb-1 mr-1 shrink-0 rounded-xl bg-gray-800 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 transition-colors"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className={cn(
              "p-2 mb-1 mr-1 shrink-0 rounded-xl transition-colors",
              input.trim() && !disabled
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            )}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
        AI can make mistakes. Verify important information.
      </div>
    </div>
  );
}
