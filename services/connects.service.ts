import { AxiosError } from "axios";
import { mainApi } from "./api";
import { Channel, Message } from "../types/connects";
import * as FileSystem from 'expo-file-system/legacy';

interface GetChannelsResponse {
  status: boolean;
  collection: string;
  channels: Channel[];
}

interface GetMessagesResponse {
  status: boolean;
  collection: string;
  messages: Message[];
}

export const ConnectsService = {
  async getChannels(): Promise<Channel[]> {
    try {
      console.log("==================================");
      console.log("Fetching Channels");
      console.log("==================================");

      const response = await mainApi.get<GetChannelsResponse>(`connects/channels/?t=${Date.now()}`);

      console.log("====== CHANNEL RESPONSE ======");
      console.log(response.data);
      console.log("==============================");

      if (response.data.status) {
        return response.data.channels;
      }

      return [];
    } catch (error) {
      console.log("====== CHANNEL ERROR ======");

      const err = error as AxiosError;

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);
      } else if (err.request) {
        console.log("No response received.");
        console.log(err.request);
      } else {
        console.log(err.message);
      }

      console.log("===========================");

      throw error;
    }
  },

  async getPeople(): Promise<any[]> {
    try {
      const response = await mainApi.get("connects/people/");
      if (response.data.status && response.data.people) {
        return response.data.people;
      }
      return [];
    } catch (error) {
      console.log("Get People Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async createChannel(channelName: string, memberEmail: string, memberName: string): Promise<any> {
    try {
      const response = await mainApi.post("connects/channel/create/", {
        channel_name: channelName,
        channel_type: "direct",
        members: [{ email: memberEmail, name: memberName, role: "member" }]
      });
      return response.data;
    } catch (error) {
      console.log("Create Channel Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async getMessages(channelId: string, after?: string): Promise<Message[]> {
    try {
      let url = `connects/messages/?channel_id=${channelId}&limit=50&lightweight=true&t=${Date.now()}`;
      if (after) {
        url += `&after=${encodeURIComponent(after)}`;
      }
      
      const response = await mainApi.get<GetMessagesResponse>(url);

      console.log("Messages API Response:", response.data.status);
      return response.data.messages || [];
    } catch (error) {
      console.log("Get Messages Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async markChannelRead(channelId: string, lastMessageId?: string): Promise<boolean> {
    try {
      const response = await mainApi.post("connects/channel/read/", {
        channel_id: channelId,
        last_read_message_id: lastMessageId
      });
      return response.data.status;
    } catch (error) {
      console.log("Mark Channel Read Error:", (error as AxiosError).message);
      return false;
    }
  },

  async getMessageAttachment(messageId: string): Promise<any[]> {
    try {
      const response = await mainApi.get(
        `connects/message/attachment/?message_id=${messageId}`,
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      return response.data.attachments || [];
    } catch (error) {
      console.log("Get Attachment Error:", (error as AxiosError).message);
      return [];
    }
  },

  async sendMessage(
    channelId: string,
    text: string,
    attachments: any[] = []
  ): Promise<any> {
    try {
      const processedAttachments = await Promise.all(
        attachments.map(async (att) => {
          let base64Url = att.uri;
          
          if (att.uri && !att.uri.startsWith('data:')) {
            try {
              const base64Data = await FileSystem.readAsStringAsync(att.uri, {
                encoding: 'base64',
              });
              base64Url = `data:${att.type || 'application/octet-stream'};base64,${base64Data}`;
            } catch (e) {
              console.log("Failed to convert file to base64:", e);
            }
          }

          return {
            id: `ATT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: att.name || "attachment",
            type: att.type || "application/octet-stream",
            size: att.size || 0,
            url: base64Url,
          };
        })
      );

      const response = await mainApi.post(
        "connects/message/send/",
        {
          channel_id: channelId,
          text,
          attachments: processedAttachments,
        }
      );

      console.log("Send Message Response:", response.data.status);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.log("Send Message Error:", err.response?.data || err.message);
      throw error;
    }
  },

  async toggleReaction(messageId: string, emoji: string): Promise<any> {
    try {
      const response = await mainApi.post(
        "connects/message/react/",
        {
          message_id: messageId,
          emoji: emoji
        }
      );
      return response.data;
    } catch (error) {
      console.log("Toggle Reaction Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async saveFCMToken(token: string, deviceType: string): Promise<boolean> {
    try {
      const response = await mainApi.post("connects/save-fcm-token/", {
        fcm_token: token,
        device_type: deviceType,
      });
      return response.data.status;
    } catch (error) {
      console.log("Save FCM Token Error:", (error as AxiosError).message);
      return false;
    }
  },
};
