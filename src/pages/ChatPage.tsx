import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import ChatArea from '../components/chat/ChatArea';
import { Menu } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setActiveConversation = useChatStore(state => state.setActiveConversation);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);

  useEffect(() => {
    setActiveConversation(id || null);
  }, [id, setActiveConversation]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 left-4 z-10 hidden md:block">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      
      {!id ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center">
             <span className="text-4xl text-white font-bold tracking-tighter">C</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400">
            Welcome to Connecto AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
            A powerful, offline, entirely browser-based AI chatbot. Your conversations are private and stay on your device.
          </p>
          <button 
            onClick={async () => {
              const newId = await useChatStore.getState().createConversation();
              navigate(`/c/${newId}`);
            }}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg shadow-blue-500/30"
          >
            Start a new conversation
          </button>
        </div>
      ) : (
        <ChatArea />
      )}
    </div>
  );
}
