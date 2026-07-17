import * as FileSystem from 'expo-file-system/legacy';
import { Channel, Message } from '../types/connects';

/**
 * CacheService: Handles lightweight UI preferences and basic channel caching.
 * DO NOT use this service for message caching. Messages use SQLite as the 
 * single source of truth via messageRepository.ts.
 */
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

  async savePeople(people: any[]): Promise<void> {
    try {
      const path = this.getCachePath('people');
      await FileSystem.writeAsStringAsync(path, JSON.stringify(people), {
        encoding: 'utf8',
      });
    } catch (error) {
      console.log('Error caching people:', error);
    }
  },

  async getCachedPeople(): Promise<any[] | null> {
    try {
      const path = this.getCachePath('people');
      const fileInfo = await FileSystem.getInfoAsync(path);
      
      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(path, { encoding: 'utf8' });
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Error reading cached people:', error);
    }
    return null;
  },

  async saveArchivedChannelIds(ids: string[]): Promise<void> {
    try {
      const path = this.getCachePath('archivedChannels');
      await FileSystem.writeAsStringAsync(path, JSON.stringify(ids), {
        encoding: 'utf8',
      });
    } catch (error) {
      console.log('Error caching archived channel ids:', error);
    }
  },

  async getArchivedChannelIds(): Promise<string[]> {
    try {
      const path = this.getCachePath('archivedChannels');
      const fileInfo = await FileSystem.getInfoAsync(path);
      
      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(path, { encoding: 'utf8' });
        return JSON.parse(data) as string[];
      }
    } catch (error) {
      console.log('Error reading cached archived channel ids:', error);
    }
    return [];
  }
};
