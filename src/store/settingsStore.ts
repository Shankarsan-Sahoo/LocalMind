import { create } from 'zustand';
import { db } from '../db';
import type { Settings } from '../types';

import { prebuiltAppConfig } from '@mlc-ai/web-llm';

export const DEFAULT_MODELS = prebuiltAppConfig.model_list.map(m => ({
  id: m.model_id,
  name: m.model_id,
  provider: 'MLC',
  size: m.vram_required_MB ? `${(m.vram_required_MB / 1024).toFixed(1)}GB VRAM` : 'Unknown VRAM'
}));

interface SettingsState {
  settings: Settings;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  model: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.95,
  systemPrompt: 'You are LocalMind, a helpful, respectful, and honest assistant. Always answer as helpfully as possible, while being safe.'
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  
  loadSettings: async () => {
    let stored = await db.settings.get(1);
    if (!stored) {
      stored = { ...defaultSettings, id: 1 };
      await db.settings.put(stored);
    }
    set({ settings: stored });
  },

  updateSettings: async (newSettings) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    await db.settings.put({ ...updated, id: 1 });
    set({ settings: updated });
  }
}));
