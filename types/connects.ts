export interface Reaction {
    emoji: string;
    count: number;
    user_reacted: boolean;
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
    message_id: string;
    channel_id: string;
    sender_email: string;
    sender_name: string;
    text: string;
    created_at: string;
    attachments?: any[];
    reactions?: Reaction[];
}

