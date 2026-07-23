import { AxiosError } from "axios";
import * as FileSystem from 'expo-file-system/legacy';
import { Channel, Message, Reaction } from "../types/connects";
import { mainApi } from "./api";
import { SessionService } from "./session.service";

const pendingDownloads = new Map<string, Promise<any[]>>();

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

export interface SalesStageItem {
  sales_stage_index: string;
  sales_stage: string;
  lead_count?: number;
  lead_mode_counts?: {
    default: number;
    review: number;
  };
}

export interface GetSalesStagesResponse {
  status: boolean;
  stages: SalesStageItem[];
  shared_leads_mode?: boolean;
  hide_stage_counts?: boolean;
}

export interface GetDealStagesResponse {
  status: boolean;
  collection?: string;
  stages: SalesStageItem[];
}

export interface DealLead {
  customer_lead_unique_id: string;
  customer_project_name?: string;
  customer_name: string;
  customer_mobile?: string;
  customer_email?: string;
  number_of_floors?: string;
  number_of_people?: string;
  customer_primary_product_name?: string;
  customer_leadsource_primary?: string;
  customer_sales_stage?: string;
  customer_sales_stage_index?: string;
  customer_assign_lead_to_name?: string;
  customer_assign_lead_to?: string;
  totalvalue_of_deal?: string;
  lead_progression_milestone?: string;
  customer_expected_signup_date?: string;
  added_by_timestamp?: string;
  forecast_status?: string;
  leads_criteria_in_client_leads?: string;
  quotation_exists?: boolean;
}

export interface GetDealLeadsResponse {
  status: boolean;
  sales_stage_index?: string;
  sales_stage?: string;
  total?: number;
  leads: DealLead[];
  lead_mode_counts?: {
    default: number;
    review: number;
  };
}

export interface DealMessageRaw {
  id: string;
  message?: string;
  timestamp?: string;
  createdAt?: string;
  sortTimestamp?: string;
  owner?: string;
  source?: string;
  status?: string;
  senderName?: string;
  senderEmail?: string;
  avatar?: string;
  messageType?: string;
  message_type?: string;
  message_source?: string;
  created_by?: string;
  created_by_name?: string;
  customer_lead_unique_id?: string;
  deal_input?: any;
  dealInput?: any;
  side?: "left" | "right";
  pulse_message_unique_id?: string;
  attachments?: any[];
}

export interface GetDealConversationResponse {
  status: boolean;
  customer_lead_unique_id?: string;
  collection?: string;
  conversationModelVersion?: number;
  has_messages?: boolean;
  messages: DealMessageRaw[];
}

export interface SendDealMessageResponse {
  status: boolean;
  collection?: string;
  created_message?: DealMessageRaw;
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

  async createGroup(companyName: string, groupName: string): Promise<any> {
    try {
      const response = await mainApi.post("connects/channel/create/", {
        channel_name: groupName,
        company_name: companyName,
        channel_type: "channel",
        members: []
      });
      return response.data;
    } catch (error) {
      console.log("Create Group Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async addMember(channelId: string, member: any): Promise<any> {
    try {
      const response = await mainApi.post("connects/channel/member/add/", {
        channel_id: channelId,
        member: member
      });
      return response.data;
    } catch (error) {
      console.log("Add Member Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async deleteChannel(channelId: string): Promise<any> {
    try {
      const response = await mainApi.post("connects/channel/delete/", {
        channel_id: channelId,
      });
      return response.data;
    } catch (error) {
      console.log("Delete Channel Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async getMessages(channelId: string, after?: string, before?: string, limit: number = 100, offset?: number): Promise<Message[]> {
    try {
      let url = `connects/messages/?channel_id=${channelId}&limit=${limit}&lightweight=true&t=${Date.now()}`;
      if (after) {
        url += `&after=${encodeURIComponent(after)}`;
      }
      if (before) {
        url += `&before=${encodeURIComponent(before)}`;
      }
      if (offset !== undefined) {
        url += `&offset=${offset}`;
      }
      
      const response = await mainApi.get<GetMessagesResponse>(url);
      console.log("Messages API Response:", response.data.status);
      
      let messages = response.data.messages || [];
      
      try {
        const user = await SessionService.getUser();
        const userEmail = user?.email_id?.toLowerCase() || "";
        
        const reverseReactionMap: Record<string, string> = {
          'like': '👍',
          'dislike': '👎',
          'heart': '❤️',
          'laugh': '😂',
          'wow': '😮',
          'sad': '😢',
          'pray': '👏'
        };

        messages = messages.map(msg => {
          let is_forwarded = msg.is_forwarded;
          let text = msg.text || '';
          if (text.startsWith('[FWD] ')) {
            is_forwarded = true;
            text = text.substring(6);
          }
          const updatedMsg = { ...msg, text, is_forwarded };

          if (updatedMsg.reactions && updatedMsg.reactions.length > 0) {
            const aggregatedReactions = new Map<string, { count: number, user_reacted: boolean }>();
            
            updatedMsg.reactions.forEach((r: any) => {
              if (r.type && r.email) {
                const emoji = reverseReactionMap[r.type] || '👍';
                const existing = aggregatedReactions.get(emoji) || { count: 0, user_reacted: false };
                existing.count += 1;
                if (r.email.toLowerCase() === userEmail) {
                  existing.user_reacted = true;
                }
                aggregatedReactions.set(emoji, existing);
              } else if (r.emoji && r.count !== undefined) {
                 aggregatedReactions.set(r.emoji, { count: r.count, user_reacted: r.user_reacted || false });
              }
            });
            
            const newReactions = Array.from(aggregatedReactions.entries()).map(([emoji, data]) => ({
              emoji,
              count: data.count,
              user_reacted: data.user_reacted
            } as Reaction));
            
            return { ...updatedMsg, reactions: newReactions };
          }
          return updatedMsg;
        });
      } catch (err) {
        console.log("Error mapping reactions", err);
      }

      return messages;
    } catch (error) {
      console.log("Get Messages Error:", (error as AxiosError).message);
      throw error;
    }
  },

  async syncMessages(channelId: string, lastSync?: string, lastMessageId?: string): Promise<{
    status: boolean;
    new: Message[];
    updated: Message[];
    deleted: string[];
    reactions: any[];
    has_more: boolean;
    server_time: string;
  }> {
    try {
      const response = await mainApi.post('connects/messages/sync/', {
        channel_id: channelId,
        last_sync: lastSync,
        last_message_id: lastMessageId
      });
      return response.data;
    } catch (error) {
      console.log("syncMessages error:", (error as AxiosError).message || error);
      throw error;
    }
  },

  async deleteMessage(channelId: string, messageId: string, deleteForEveryone: boolean = false): Promise<boolean> {
    try {
      const response = await mainApi.post("connects/message/delete/", {
        channel_id: channelId,
        message_id: messageId,
        delete_for_everyone: deleteForEveryone
      });
      return response.data.status;
    } catch (error) {
      console.log("Delete Message Error:", (error as AxiosError).message);
      // Even if backend fails, we return false and handle local optimistic update in UI layer if needed,
      // but usually we want to throw to let UI know
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
    // Prevent pointless requests for optimistic local messages
    if (!messageId || !messageId.startsWith('MSG_')) {
      return [];
    }

    // Request deduplication
    if (pendingDownloads.has(messageId)) {
      return pendingDownloads.get(messageId)!;
    }

    const promise = (async () => {
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
      } finally {
        pendingDownloads.delete(messageId);
      }
    })();

    pendingDownloads.set(messageId, promise);
    return promise;
  },

  async sendMessage(
    channelId: string,
    text: string,
    attachments: any[] = [],
    replyToMessageId?: string,
    isForwarded?: boolean,
    localId?: string,
    mentions?: any[]
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
            ...(att.duration !== undefined && { duration: att.duration })
          };
        })
      );

      const response = await mainApi.post(
        "connects/message/send/",
        {
          channel_id: channelId,
          text: isForwarded ? `[FWD] ${text || ''}` : text,
          attachments: processedAttachments,
          ...(replyToMessageId && { reply_to_message_id: replyToMessageId }),
          ...(isForwarded && { is_forwarded: true }),
          ...(localId && { local_id: localId }),
          ...(mentions && mentions.length > 0 && { mentions }),
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
    const reactionMap: Record<string, string> = {
      '👍': 'like',
      '👎': 'dislike',
      '❤️': 'heart',
      '😂': 'laugh',
      '😮': 'wow',
      '😢': 'sad',
      '👏': 'pray'
    };
    const reactionType = reactionMap[emoji] || 'like';

    try {
      const response = await mainApi.post(
        "connects/message/react/",
        {
          message_id: messageId,
          reaction_type: reactionType
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

  async togglePinMessage(channelId: string, messageId: string, isPinned: boolean): Promise<boolean> {
    try {
      const response = await mainApi.post("connects/toggle_pin/", {
        channel_id: channelId,
        message_id: messageId,
        is_pinned: isPinned,
      });
      return response.data.status;
    } catch (error) {
      console.log("Toggle Pin Message Error:", (error as AxiosError).message);
      return false;
    }
  },

  /* clear chat functionality */
  async clearChat(channelId: string): Promise<boolean> {
  try {
    const response = await mainApi.post("connects/clear-chat/", {
      channel_id: channelId,
    });

    return response.data.status;
  } catch (error) {
    console.log(
      "Clear Chat Error:",
      (error as AxiosError).message
    );
    return false;
  }
},

  async getSalesStages(): Promise<SalesStageItem[]> {
    try {
      const response = await mainApi.get<GetSalesStagesResponse>("connects/sales-stages/");
      if (response.data && response.data.status && response.data.stages) {
        return response.data.stages;
      }
      return [];
    } catch (error) {
      console.log("Get Sales Stages Error:", (error as AxiosError).message);
      return [];
    }
  },

  async getDealStages(): Promise<SalesStageItem[]> {
    try {
      const response = await mainApi.get<GetDealStagesResponse>("connects/deal-stages/");
      if (response.data && response.data.status && response.data.stages) {
        return response.data.stages;
      }
      return [];
    } catch (error) {
      console.log("Get Deal Stages Error:", (error as AxiosError).message);
      return [];
    }
  },

  async getDealLeads(
    salesStageIndex: string,
    leadListMode: string = "default",
    page: number = 1,
    pageSize: number = 25
  ): Promise<GetDealLeadsResponse> {
    try {
      const response = await mainApi.get<GetDealLeadsResponse>(
        `connects/deal-leads/?sales_stage_index=${salesStageIndex}&lead_list_mode=${leadListMode}&page=${page}&page_size=${pageSize}`
      );
      if (response.data && response.data.status) {
        return response.data;
      }
      return { status: false, leads: [], total: 0 };
    } catch (error) {
      console.log("Get Deal Leads Error:", (error as AxiosError).message);
      return { status: false, leads: [], total: 0 };
    }
  },

  async getDealConversation(customerLeadUniqueId: string): Promise<Message[]> {
    try {
      const response = await mainApi.get<GetDealConversationResponse>(
        `connects/deal-conversation/?customer_lead_unique_id=${customerLeadUniqueId}`
      );
      if (response.data && response.data.status && response.data.messages) {
        return response.data.messages.map(raw => this.mapDealMessageToMessage(raw, customerLeadUniqueId));
      }
      return [];
    } catch (error) {
      console.log("Get Deal Conversation Error:", (error as AxiosError).message);
      return [];
    }
  },

  async sendDealMessage(
    customerLeadUniqueId: string,
    text: string,
    attachments: any[] = []
  ): Promise<SendDealMessageResponse> {
    try {
      const response = await mainApi.post<SendDealMessageResponse>(
        "connects/deal-conversation/send/",
        {
          customer_lead_unique_id: customerLeadUniqueId,
          text: text,
          attachments: attachments,
        }
      );
      return response.data;
    } catch (error) {
      console.log("Send Deal Message Error:", (error as AxiosError).message);
      throw error;
    }
  },

  mapDealMessageToMessage(raw: DealMessageRaw, leadId: string): Message {
    return {
      message_id: raw.pulse_message_unique_id || raw.id || `MSG_${Date.now()}`,
      channel_id: `lead-${leadId}`,
      sender_email: raw.senderEmail || raw.created_by || "",
      sender_name: raw.senderName || raw.created_by_name || "System",
      text: raw.message || "",
      created_at: raw.createdAt || raw.timestamp || raw.sortTimestamp || new Date().toISOString(),
      status: (raw.status as any) || "sent",
      attachments: raw.attachments || [],
      side: raw.side,
      message_type: raw.messageType || raw.message_type,
    };
  },

};
