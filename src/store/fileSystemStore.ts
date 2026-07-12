import { create } from 'zustand';

interface FileSystemState {
  workspaceHandle: FileSystemDirectoryHandle | null;
  workspaceName: string | null;
  connectWorkspace: () => Promise<void>;
  disconnectWorkspace: () => void;
  listWorkspaceFiles: () => Promise<string[]>;
  readFile: (filePath: string) => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  workspaceHandle: null,
  workspaceName: null,

  connectWorkspace: async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      set({ workspaceHandle: handle, workspaceName: handle.name });
    } catch (err) {
      console.error("Failed to connect workspace", err);
    }
  },

  disconnectWorkspace: () => {
    set({ workspaceHandle: null, workspaceName: null });
  },

  listWorkspaceFiles: async () => {
    const { workspaceHandle } = get();
    if (!workspaceHandle) return [];

    const files: string[] = [];
    async function traverse(handle: FileSystemDirectoryHandle, path = '') {
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          files.push(path + entry.name);
        } else if (entry.kind === 'directory' && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await traverse(entry, path + entry.name + '/');
        }
      }
    }
    await traverse(workspaceHandle);
    return files;
  },

  readFile: async (filePath: string) => {
    const { workspaceHandle } = get();
    if (!workspaceHandle) return null;

    try {
      const parts = filePath.split('/').filter(Boolean);
      let currentHandle = workspaceHandle;
      
      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
      }
      
      const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1]);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (err) {
      console.error("Error reading file:", err);
      return null;
    }
  },

  writeFile: async (filePath: string, content: string) => {
    const { workspaceHandle } = get();
    if (!workspaceHandle) return false;

    // The user requested explicit permission before writing
    if (!window.confirm(`Connecto AI is requesting permission to write to: ${filePath}\n\nDo you allow this?`)) {
      return false; // Permission denied by user
    }

    try {
      const parts = filePath.split('/').filter(Boolean);
      let currentHandle = workspaceHandle;
      
      // Navigate/create directories
      for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true });
      }
      
      const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1], { create: true });
      
      // Request write permission if not already granted by browser
      // @ts-ignore
      if (await fileHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        // @ts-ignore
        await fileHandle.requestPermission({ mode: 'readwrite' });
      }

      // @ts-ignore
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err) {
      console.error("Error writing file:", err);
      return false;
    }
  }
}));
