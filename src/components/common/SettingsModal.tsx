import { X, Save, Trash2 } from 'lucide-react';
import { useSettingsStore, DEFAULT_MODELS } from '../../store/settingsStore';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { useState, useEffect } from 'react';

export default function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen } = useUIStore();
  const { settings, updateSettings } = useSettingsStore();
  const deleteConversation = useChatStore(state => state.deleteConversation);
  const conversations = useChatStore(state => state.conversations);
  
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settingsModalOpen) {
      setLocalSettings(settings);
    }
  }, [settingsModalOpen, settings]);

  if (!settingsModalOpen) return null;

  const handleSave = async () => {
    await updateSettings(localSettings);
    setSettingsModalOpen(false);
  };

  const handleClearChats = async () => {
    if (confirm("Are you sure you want to delete all conversations? This cannot be undone.")) {
      for (const conv of conversations) {
        await deleteConversation(conv.id);
      }
    }
  };

  const handleClearCache = async () => {
    if (confirm("This will delete all downloaded AI model weights. You will need to re-download them to use the app again. Are you sure?")) {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('webllm') || key.includes('tvmjs')) {
          await caches.delete(key);
        }
      }
      alert("Model cache cleared successfully!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={() => setSettingsModalOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Model</label>
            <select 
              value={localSettings.model}
              onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {DEFAULT_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.size})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Larger models require more memory and take longer to download initially.</p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">System Prompt</label>
            <textarea 
              value={localSettings.systemPrompt}
              onChange={(e) => setLocalSettings({...localSettings, systemPrompt: e.target.value})}
              rows={3}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Temperature */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Temperature</span>
                <span className="text-gray-500">{localSettings.temperature}</span>
              </label>
              <input 
                type="range" 
                min="0" max="2" step="0.1"
                value={localSettings.temperature}
                onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
                className="w-full accent-blue-600"
              />
            </div>
            
            {/* Top P */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Top P</span>
                <span className="text-gray-500">{localSettings.topP}</span>
              </label>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={localSettings.topP}
                onChange={(e) => setLocalSettings({...localSettings, topP: parseFloat(e.target.value)})}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Max Tokens</label>
              <input 
                type="number" 
                min="1" max="8192"
                value={localSettings.maxTokens}
                onChange={(e) => setLocalSettings({...localSettings, maxTokens: parseInt(e.target.value)})}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="font-semibold text-red-500 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Danger Zone</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleClearChats}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium text-sm flex-1 text-center"
              >
                Clear All Conversations
              </button>
              <button 
                onClick={handleClearCache}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium text-sm flex-1 text-center"
              >
                Clear Downloaded Models
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
          <button 
            onClick={() => setSettingsModalOpen(false)}
            className="px-5 py-2 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
