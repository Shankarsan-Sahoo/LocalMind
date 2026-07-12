import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Settings } from 'lucide-react';

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setSettingsModalOpen } = useUIStore();
  const { createConversation } = useChatStore();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const handleAction = async (action: string) => {
    setCommandPaletteOpen(false);
    if (action === 'new') {
      const id = await createConversation();
      navigate(`/c/${id}`);
    } else if (action === 'settings') {
      setSettingsModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)}>
      <div 
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-500" />
          <input 
            autoFocus
            type="text" 
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full p-4 bg-transparent outline-none text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          <div className="text-xs font-semibold text-gray-500 px-3 py-2">Actions</div>
          
          <button 
            onClick={() => handleAction('new')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
          >
            <Plus className="w-5 h-5 text-blue-500" />
            <span className="font-medium">New Chat</span>
            <span className="ml-auto text-xs text-gray-500 flex gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">Enter</kbd>
            </span>
          </button>

          <button 
            onClick={() => handleAction('settings')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
