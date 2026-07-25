import axios, { AxiosError } from "axios";
import * as FileSystem from 'expo-file-system/legacy';
// @ts-ignore
import * as MediaLibrary from 'expo-media-library';
import { Channel, Message, Reaction } from "../types/connects";
import { mainApi } from "./api";
import { SessionService } from "./session.service";
import { CONFIG } from "../constants/config";

const pendingDownloads = new Map<string, Promise<any[]>>();
const attachmentMemoryCache = new Map<string, any[]>();

function uint8ToBase64(uint8: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = uint8.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = uint8[i];
    const b2 = i + 1 < len ? uint8[i + 1] : 0;
    const b3 = i + 2 < len ? uint8[i + 2] : 0;

    const c1 = b1 >> 2;
    const c2 = ((b1 & 3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 15) << 2) | (b3 >> 6);
    const c4 = b3 & 63;

    base64 += chars[c1] + chars[c2] + (i + 1 < len ? chars[c3] : '=') + (i + 2 < len ? chars[c4] : '=');
  }
  return base64;
}

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

    if (attachmentMemoryCache.has(messageId)) {
      return attachmentMemoryCache.get(messageId)!;
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
        const atts = response.data.attachments || [];
        if (atts.length > 0) {
          attachmentMemoryCache.set(messageId, atts);
        }
        return atts;
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

  async downloadAttachmentBinary(downloadUrl: string, targetPath: string): Promise<boolean> {
    try {
      let rawString = typeof downloadUrl === 'string' ? downloadUrl : ((downloadUrl as any)?.uri || (downloadUrl as any)?.url || (downloadUrl as any)?.file_url || (downloadUrl as any)?.dat || String(downloadUrl || ''));
      let cleanUrl = rawString;

      const contentMatch = rawString.match(/(content:\/\/[^\s}]+)/);
      const fileMatch = rawString.match(/(file:\/\/[^\s}]+)/);
      const httpMatch = rawString.match(/(https?:\/\/[^\s}]+)/);

      if (contentMatch) cleanUrl = contentMatch[1];
      else if (fileMatch) cleanUrl = fileMatch[1];
      else if (httpMatch) cleanUrl = httpMatch[1];

      if (cleanUrl.startsWith('content://') || cleanUrl.startsWith('file://')) {
        try {
          await FileSystem.copyAsync({ from: cleanUrl, to: targetPath });
          return true;
        } catch (e) {
          return false;
        }
      }

      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        const apiBase = CONFIG.API_BASE_URL.endsWith('/') ? CONFIG.API_BASE_URL : `${CONFIG.API_BASE_URL}/`;
        const domainBase = apiBase.replace(/\/api\/?$/, '');
        if (cleanUrl.startsWith('/')) {
          cleanUrl = `${domainBase}${cleanUrl}`;
        } else {
          cleanUrl = `${apiBase}${cleanUrl}`;
        }
      }

      // For S3 or public URLs: use native FileSystem.downloadAsync (direct binary stream to disk)
      const isS3Url = cleanUrl.includes('.amazonaws.com') || cleanUrl.includes('.s3.');
      if (isS3Url) {
        console.log('Downloading S3 binary directly to disk via FileSystem.downloadAsync:', cleanUrl);
        const downloadRes = await FileSystem.downloadAsync(cleanUrl, targetPath);
        if (downloadRes.status >= 200 && downloadRes.status < 300) {
          const info = await FileSystem.getInfoAsync(targetPath);
          return info.exists && info.size > 0;
        }
        return false;
      }

      // For backend session-authenticated URLs: pass Cookie header in downloadAsync options
      const token = await SessionService.getToken();
      const options = token ? { headers: { Cookie: `sessionid=${token}` } } : {};
      const downloadRes = await FileSystem.downloadAsync(cleanUrl, targetPath, options);

      if (downloadRes.status >= 200 && downloadRes.status < 300) {
        const info = await FileSystem.getInfoAsync(targetPath);
        return info.exists && info.size > 0;
      }
      return false;
    } catch (e) {
      console.log("downloadAttachmentBinary error:", e);
      return false;
    }
  },

  async uploadVideoToS3(localUri: string, fileName: string, mimeType: string): Promise<string> {
    try {
      console.log('Requesting S3 presigned upload URL for:', fileName);
      const res = await mainApi.post('connects/message/upload-url/', {
        fileName,
        fileType: mimeType || 'video/mp4',
      });

      if (!res.data || !res.data.uploadUrl || !res.data.fileUrl) {
        throw new Error('Failed to get presigned upload URL from backend');
      }

      const { uploadUrl, fileUrl } = res.data;
      console.log('Uploading file directly to S3 via presigned PUT URL...');

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': mimeType || 'video/mp4',
          'x-amz-acl': 'public-read',
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`S3 upload failed with HTTP status ${uploadResult.status}`);
      }

      console.log('Successfully uploaded video directly to S3:', fileUrl);
      return fileUrl;
    } catch (err) {
      console.log('uploadVideoToS3 error:', err);
      throw err;
    }
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
          let rawUri: string = att.uri || '';

          // ── Step 1: Normalize Android Intent strings to clean content:// URI ──
          if (rawUri.includes('Intent {') || rawUri.includes('dat=')) {
            const contentMatch = rawUri.match(/(content:\/\/[^\s}]+)/);
            const fileMatch = rawUri.match(/(file:\/\/[^\s}]+)/);
            if (contentMatch) rawUri = contentMatch[1];
            else if (fileMatch) rawUri = fileMatch[1];
          }

          const isVideo = (att.type && att.type.startsWith('video/')) ||
                          (att.mimeType && att.mimeType.startsWith('video/')) ||
                          (att.name && (att.name.endsWith('.mp4') || att.name.endsWith('.mov') || att.name.endsWith('.webm')));

          // ── Step 2: Direct S3 presigned PUT upload for videos ────────────────
          if (isVideo && rawUri && !rawUri.startsWith('http')) {
            try {
              console.log('Uploading video directly to S3 via presigned URL:', att.name);
              const s3FileUrl = await this.uploadVideoToS3(rawUri, att.name || 'video.mp4', att.type || 'video/mp4');
              return {
                id: `ATT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: att.name || 'video.mp4',
                type: att.type || 'video/mp4',
                size: att.size || 0,
                url: s3FileUrl,
                ...(att.duration !== undefined && { duration: att.duration })
              };
            } catch (s3Err) {
              console.log('Direct S3 upload failed, falling back to base64 encoding:', s3Err);
              // Fallback to base64 pipeline below
            }
          }

          // ── Step 3: Read image / small attachment into base64 ─────────────────
          let base64Url = rawUri;
          let calculatedSize = att.size || 0;

          if (rawUri.startsWith('content://')) {
            try {
              console.log('Reading content:// URI using fetch():', rawUri);
              const response = await fetch(rawUri);
              const blob = await response.blob();

              const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') resolve(reader.result);
                  else reject(new Error('FileReader result is not string'));
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              if (base64Data && base64Data.startsWith('data:')) {
                base64Url = base64Data;
                const rawBase64 = base64Data.split(',')[1] || '';
                calculatedSize = Math.floor((rawBase64.length * 3) / 4);
              }
            } catch (fetchErr) {
              console.log('fetch() failed for content:// URI:', fetchErr);
            }
          }

          if (!base64Url.startsWith('data:') && (rawUri.startsWith('file://') || rawUri.startsWith('/'))) {
            try {
              const base64Data = await FileSystem.readAsStringAsync(rawUri, {
                encoding: 'base64',
              });
              base64Url = `data:${att.type || 'application/octet-stream'};base64,${base64Data}`;
              calculatedSize = Math.floor((base64Data.length * 3) / 4);
            } catch (e) {
              console.log('Failed to convert file:// to base64:', e, 'uri:', rawUri);
            }
          } else if (base64Url.startsWith('data:')) {
            const base64Str = base64Url.split(',')[1] || '';
            calculatedSize = Math.floor((base64Str.length * 3) / 4);
          }

          // Safety UX limit for non-S3 base64 uploads (200 MB)
          if (calculatedSize > 200 * 1024 * 1024) {
            const mb = (calculatedSize / (1024 * 1024)).toFixed(1);
            throw new Error(`File "${att.name}" is ${mb} MB. Maximum allowed size is 200 MB.`);
          }

          return {
            id: `ATT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: att.name || 'attachment',
            type: att.type || 'application/octet-stream',
            size: calculatedSize,
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
    attachments: any[] = [],
    dealInput?: string
  ): Promise<SendDealMessageResponse> {
    try {
      const response = await mainApi.post<SendDealMessageResponse>(
        "connects/deal-conversation/send/",
        {
          customer_lead_unique_id: customerLeadUniqueId,
          text: text,
          attachments: attachments,
          ...(dealInput && { deal_input: dealInput, dealInput: dealInput }),
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
      deal_input: raw.deal_input || raw.dealInput || undefined,
    };
  },

};
