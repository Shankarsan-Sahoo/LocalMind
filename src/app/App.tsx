import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import ChatPage from '../pages/ChatPage';
import Layout from '../layouts/Layout';

export default function App() {
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const loadConversations = useChatStore(state => state.loadConversations);
  const setWebGpuSupported = useUIStore(state => state.setWebGpuSupported);

  useEffect(() => {
    loadSettings();
    loadConversations();
    
    // Check WebGPU support
    if (!navigator.gpu) {
      setWebGpuSupported(false);
    } else {
      setWebGpuSupported(true);
    }
  }, [loadSettings, loadConversations, setWebGpuSupported]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="c/:id" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
