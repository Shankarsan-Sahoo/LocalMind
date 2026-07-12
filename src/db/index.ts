import Dexie, { type Table } from 'dexie';
import type { Conversation, Message, Settings } from '../types';

export class ChatDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  settings!: Table<Settings, number>;

  constructor() {
    super('ConnectoAIDatabase');
    this.version(1).stores({
      conversations: 'id, createdAt, updatedAt',
      messages: 'id, conversationId, createdAt',
      settings: 'id'
    });
  }
}

export const db = new ChatDB();
