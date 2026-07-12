import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import SettingsModal from '../components/common/SettingsModal';
import CommandPalette from '../components/common/CommandPalette';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/cn';
import { Menu } from 'lucide-react';

export default function Layout() {
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const webGpuSupported = useUIStore(state => state.webGpuSupported);

  if (webGpuSupported === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl text-center border border-gray-200 dark:border-gray-700">
          <div className="text-red-500 mb-4 text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">WebGPU Not Supported</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This browser does not support local AI inference. Please try using a recent version of Chrome or Edge on a device with a dedicated or integrated GPU.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => toggleSidebar()}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed md:static inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 md:hidden">
          <button onClick={() => toggleSidebar()} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 font-semibold">LocalMind</span>
        </div>
        
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>

      <SettingsModal />
      <CommandPalette />
    </div>
  );
}
