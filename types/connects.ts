export interface Reaction {
    emoji: string;
    count: number;
    user_reacted: boolean;
}

export interface Mention {
    id?: string;
    user_id: string;
    display_name: string;
    start_index: number;
    end_index: number;
    mention_type?: string;
}

export interface ConversationSnapshot {
    messages: Message[];
    mentions: Mention[];
    attachments: any[];
    reactions: Reaction[];
    channelMetadata?: Channel | null;
}

export interface Member {
    email: string;
    name: string;
    designation?: string;
    department?: string;
    role?: string;
    profile_image_url?: string;
}

export interface LastMessage {
    message_id: string;
    text: string;
    sender_email: string;
    sender_name: string;
    created_at: string;
    attachments?: any[];
}

export interface Channel {
    channel_id: string;
    channel_name: string;
    channel_type: "direct" | "channel";
    description: string;
    members: Member[];
    unread_count: number;
    last_message?: LastMessage;
    created_at: string;
    updated_at: string;
    channel_image?: string;
}

export interface Message {
    local_id?: string;
    message_id: string; // server ID
    channel_id: string;
    sender_email: string;
    sender_name: string;
    text: string;
    created_at: string;
    status?: "pending" | "sending" | "sent" | "delivered" | "read" | "failed";
    attachments?: any[];
    reactions?: Reaction[];
    mentions?: Mention[];
    reply_to?: {
        message_id: string;
        sender_name: string;
        text: string;
        attachments?: any[];
    };
    is_pinned?: boolean;
    is_forwarded?: boolean;
    is_edited?: boolean;
    is_deleted?: boolean;
    deleted_by?: string;
    is_starred?: boolean;
    side?: "left" | "right";
    message_type?: string;
    deal_input?: string;
    dealInput?: string;
}
