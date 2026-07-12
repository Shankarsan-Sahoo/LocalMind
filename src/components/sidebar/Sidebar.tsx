import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { MessageSquare, Plus, Settings as SettingsIcon, Trash2, Edit2, X, Check, FolderOpen, Folder } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useFileSystemStore } from '../../store/fileSystemStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const conversations = useChatStore(state => state.conversations);
  const createConversation = useChatStore(state => state.createConversation);
  const deleteConversation = useChatStore(state => state.deleteConversation);
  const renameConversation = useChatStore(state => state.renameConversation);
  const setSettingsModalOpen = useUIStore(state => state.setSettingsModalOpen);
  
  const { workspaceName, connectWorkspace, disconnectWorkspace } = useFileSystemStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewChat = async () => {
    const newId = await createConversation();
    navigate(`/c/${newId}`);
  };

  const startEdit = (e: React.MouseEvent, convId: string, title: string) => {
    e.stopPropagation();
    setEditingId(convId);
    setEditTitle(title);
  };

  const saveEdit = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    await deleteConversation(convId);
    if (id === convId) {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 p-3">
      <button 
        onClick={handleNewChat}
        className="flex items-center gap-2 w-full p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700 font-medium"
      >
        <Plus className="w-5 h-5" />
        New Chat
      </button>
      
      <div className="flex-1 overflow-y-auto mt-4 space-y-1">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">Recent</div>
        
        {conversations.map(conv => (
          <div 
            key={conv.id}
            onClick={() => navigate(`/c/${conv.id}`)}
            className={cn(
              "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
              id === conv.id 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                : "hover:bg-gray-200 dark:hover:bg-gray-800"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            
            {editingId === conv.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(e as any, conv.id);
                    if (e.key === 'Escape') cancelEdit(e as any);
                  }}
                  className="w-full bg-white dark:bg-gray-900 px-1 py-0.5 rounded border border-blue-500 text-sm focus:outline-none"
                  autoFocus
                />
                <button onClick={(e) => saveEdit(e, conv.id)} className="p-1 hover:text-green-500"><Check className="w-3 h-3" /></button>
                <button onClick={cancelEdit} className="p-1 hover:text-red-500"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <div className="flex-1 truncate text-sm">{conv.title}</div>
            )}

            {editingId !== conv.id && (
              <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-gray-200 dark:from-gray-800 pl-4">
                <button 
                  onClick={(e) => startEdit(e, conv.id, conv.title)}
                  className="p-1 text-gray-500 hover:text-blue-500"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="p-1 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workspace Section */}
      <div className="mt-4 px-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Local Workspace</div>
        {workspaceName ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <Folder className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">{workspaceName}</span>
            </div>
            <button onClick={disconnectWorkspace} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWorkspace}
            className="flex items-center gap-2 w-full p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors border border-dashed border-gray-300 dark:border-gray-700"
          >
            <FolderOpen className="w-4 h-4" />
            Connect Folder
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => setSettingsModalOpen(true)}
          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <SettingsIcon className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );
}
