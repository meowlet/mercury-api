import { Conversation, ConversationMember, MemberRole } from "../entity/Chat";

export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByParticipant(
    userId: string,
    skip?: number,
    limit?: number
  ): Promise<Conversation[]>;
  findDirectConversation(
    user1Id: string,
    user2Id: string
  ): Promise<Conversation | null>;
  create(conversation: Conversation): Promise<Conversation>;
  update(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  delete(id: string): Promise<void>;
  addMember(conversationId: string, member: ConversationMember): Promise<void>;
  removeMember(conversationId: string, userId: string): Promise<void>;
  updateMemberRole(
    conversationId: string,
    userId: string,
    role: MemberRole
  ): Promise<void>;
  getMembers(conversationId: string): Promise<ConversationMember[]>;
  updateLastActivity(
    conversationId: string,
    lastMessageId?: string
  ): Promise<void>;

  getActiveMembers(conversationId: string): Promise<ConversationMember[]>;
  deactivateMember(conversationId: string, userId: string): Promise<void>;
  reactivateMember(conversationId: string, userId: string): Promise<void>;
}
