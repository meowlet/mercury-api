import {
  Conversation,
  Message,
  ConversationMember,
  ConversationType,
  MessageType,
  MemberRole,
} from "../entity/Chat";

export interface IChatService {
  // Conversation methods
  createConversation(data: CreateConversationData): Promise<Conversation>;
  getConversation(id: string, userId: string): Promise<Conversation>;
  getUserConversations(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ conversations: Conversation[]; total: number }>;
  updateConversation(
    id: string,
    userId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation>;
  deleteConversation(id: string, userId: string): Promise<void>;

  // Member methods
  addMember(
    conversationId: string,
    userId: string,
    targetUserId: string
  ): Promise<void>;
  removeMember(
    conversationId: string,
    userId: string,
    targetUserId: string
  ): Promise<void>;
  updateMemberRole(
    conversationId: string,
    userId: string,
    targetUserId: string,
    role: MemberRole
  ): Promise<void>;
  leaveConversation(conversationId: string, userId: string): Promise<void>;

  // Message methods
  sendMessage(data: SendMessageData): Promise<Message>;
  getMessage(id: string, userId: string): Promise<Message>;
  getMessages(
    conversationId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ messages: Message[]; total: number }>;
  editMessage(id: string, userId: string, content: string): Promise<Message>;
  deleteMessage(id: string, userId: string): Promise<void>;
  markAsRead(messageId: string, userId: string): Promise<void>;

  // Search and utility
  searchMessages(
    query: string,
    userId: string,
    conversationId?: string
  ): Promise<Message[]>;
  getUnreadCount(userId: string): Promise<number>;
}

export interface CreateConversationData {
  // type: ConversationType;
  participants: string[];
  title?: string;
  description?: string;
  createdBy: string;
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyTo?: string;
  attachments?: File[];
}
