import * as SecureStore from "expo-secure-store";

const TOKEN = "pulse_token";
const USER = "pulse_user";

export const SessionService = {
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN, token);
  },

  async getToken() {
    return await SecureStore.getItemAsync(TOKEN);
  },

  async saveUser(user: any) {
    await SecureStore.setItemAsync(USER, JSON.stringify(user));
  },

  async getUser() {
    const user = await SecureStore.getItemAsync(USER);
    return user ? JSON.parse(user) : null;
  },

  async clearSession() {
    await SecureStore.deleteItemAsync(TOKEN);
    await SecureStore.deleteItemAsync(USER);
  },
};