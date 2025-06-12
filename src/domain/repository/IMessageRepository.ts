import { Message } from "../entity/Chat";

export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  findByConversation(
    conversationId: string,
    skip?: number,
    limit?: number
  ): Promise<Message[]>;
  create(message: Message): Promise<Message>;
  update(id: string, updates: Partial<Message>): Promise<Message>;
  delete(id: string): Promise<void>;
  markAsRead(messageId: string, userId: string): Promise<void>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
  search(
    query: string,
    conversationId?: string,
    userId?: string
  ): Promise<Message[]>;
}
