import * as FileSystem from 'expo-file-system/legacy';
import { Channel, Message } from '../types/connects';

export const CacheService = {
  getCachePath(key: string): string {
    return `${FileSystem.documentDirectory}${key}.json`;
  },

  async saveChannels(channels: Channel[]): Promise<void> {
    try {
      const path = this.getCachePath('channels');
      await FileSystem.writeAsStringAsync(path, JSON.stringify(channels), {
        encoding: 'utf8',
      });
    } catch (error) {
      console.log('Error caching channels:', error);
    }
  },

  async getCachedChannels(): Promise<Channel[] | null> {
    try {
      const path = this.getCachePath('channels');
      const fileInfo = await FileSystem.getInfoAsync(path);
      
      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(path, { encoding: 'utf8' });
        return JSON.parse(data) as Channel[];
      }
    } catch (error) {
      console.log('Error reading cached channels:', error);
    }
    return null;
  },

  async saveMessages(channelId: string, messages: Message[]): Promise<void> {
    try {
      const path = this.getCachePath(`messages_${channelId}`);
      await FileSystem.writeAsStringAsync(path, JSON.stringify(messages), {
        encoding: 'utf8',
      });
    } catch (error) {
      console.log('Error caching messages:', error);
    }
  },

  async getCachedMessages(channelId: string): Promise<Message[] | null> {
    try {
      const path = this.getCachePath(`messages_${channelId}`);
      const fileInfo = await FileSystem.getInfoAsync(path);
      
      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(path, { encoding: 'utf8' });
        return JSON.parse(data) as Message[];
      }
    } catch (error) {
      console.log('Error reading cached messages:', error);
    }
    return null;
  }
};
