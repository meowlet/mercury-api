import {
  IChatService,
  CreateConversationData,
  SendMessageData,
} from "../../domain/service/IChatService";
import { IConversationRepository } from "../../domain/repository/IConversationRepository";
import { IMessageRepository } from "../../domain/repository/IMessageRepository";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import {
  Conversation,
  Message,
  ConversationMember,
  ConversationType,
  MessageType,
  MemberRole,
  AttachmentType,
} from "../../domain/entity/Chat";
import { ErrorType, throwError } from "../../common/error/AppError";
import { ObjectId } from "mongodb";

export class ChatService implements IChatService {
  constructor(
    private conversationRepository: IConversationRepository,
    private messageRepository: IMessageRepository,
    private userRepository: IUserRepository
  ) {}

  private generateLastMessageText(message: Message): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content;
      case MessageType.IMAGE:
        return "📷 Sent a photo";
      case MessageType.FILE:
        if (message.attachments && message.attachments.length > 0) {
          const attachment = message.attachments[0];
          switch (attachment.type) {
            case AttachmentType.IMAGE:
              return "📷 Sent a photo";
            case AttachmentType.VIDEO:
              return "🎥 Sent a video";
            case AttachmentType.AUDIO:
              return "🎵 Sent an audio";
            case AttachmentType.DOCUMENT:
              return `📄 Sent a file: ${attachment.name}`;
            default:
              return "📎 Sent a file";
          }
        }
        return "📎 Sent a file";
      case MessageType.SYSTEM:
        return message.content;
      default:
        return message.content;
    }
  }

  async createConversation(
    data: CreateConversationData
  ): Promise<Conversation> {
    const conversationType =
      data.participants.length > 2
        ? ConversationType.GROUP
        : ConversationType.DIRECT;

    // Validate participants exist
    for (const participantId of data.participants) {
      const user = await this.userRepository.findById(participantId);
      if (!user) {
        throwError(ErrorType.NOT_FOUND, {
          message: `User ${participantId} not found`,
        });
      }
    }

    // For direct conversations, check if already exists
    if (conversationType === ConversationType.DIRECT) {
      const existing = await this.conversationRepository.findDirectConversation(
        data.participants[0],
        data.participants[1]
      );
      if (existing) {
        return existing;
      }
    }

    // Create conversation
    const conversation: Conversation = {
      participants: data.participants.map((id) => new ObjectId(id)),
      type: conversationType,
      title:
        conversationType === ConversationType.GROUP ? data.title : undefined,
      description: data.description,
      isActive: true,
      createdBy: new ObjectId(data.createdBy),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
    };

    const created = await this.conversationRepository.create(conversation);

    // Add members
    for (const participantId of data.participants) {
      const member: ConversationMember = {
        conversation: created._id as ObjectId,
        user: new ObjectId(participantId),
        role:
          participantId === data.createdBy
            ? MemberRole.OWNER
            : MemberRole.MEMBER,
        joinedAt: new Date(),
        isActive: true,
      };
      await this.conversationRepository.addMember(
        created._id!.toString(),
        member
      );
    }

    return created;
  }

  async getConversation(id: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throwError(ErrorType.NOT_FOUND, { message: "Conversation not found" });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Not a participant in this conversation",
      });
    }

    return conversation;
  }

  async getUserConversations(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const skip = (page - 1) * limit;
    const conversations = await this.conversationRepository.findByParticipant(
      userId,
      skip,
      limit
    );

    // For total count, we'd need a separate method in repository
    const total = conversations.length; // Simplified for now

    return { conversations, total };
  }

  async updateConversation(
    id: string,
    userId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const conversation = await this.getConversation(id, userId);

    // Check permissions (only admins/owners can update)
    const members = await this.conversationRepository.getMembers(id);
    const userMember = members.find((m) => m.user.toString() === userId);

    if (
      !userMember ||
      (userMember.role !== MemberRole.ADMIN &&
        userMember.role !== MemberRole.OWNER)
    ) {
      throwError(ErrorType.FORBIDDEN, { message: "Insufficient permissions" });
    }

    return this.conversationRepository.update(id, updates);
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    const conversation = await this.getConversation(id, userId);

    // Only owner can delete
    const members = await this.conversationRepository.getMembers(id);
    const userMember = members.find((m) => m.user.toString() === userId);

    if (!userMember || userMember.role !== MemberRole.OWNER) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Only owner can delete conversation",
      });
    }

    await this.conversationRepository.delete(id);
  }

  async addMember(
    conversationId: string,
    userId: string,
    targetUserId: string
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId, userId);

    // Kiểm tra conversation type
    if (conversation.type === ConversationType.DIRECT) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Cannot add members to direct conversation",
      });
    }

    // Check permissions
    const members = await this.conversationRepository.getMembers(
      conversationId
    );
    const userMember = members.find((m) => m.user.toString() === userId);

    if (
      !userMember ||
      (userMember.role !== MemberRole.ADMIN &&
        userMember.role !== MemberRole.OWNER)
    ) {
      throwError(ErrorType.FORBIDDEN, { message: "Insufficient permissions" });
    }

    // Check if target user exists
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throwError(ErrorType.NOT_FOUND, { message: "User not found" });
    }

    // Check if already member
    const existingMember = members.find(
      (m) => m.user.toString() === targetUserId
    );
    if (existingMember) {
      if (!existingMember.isActive) {
        await this.conversationRepository.reactivateMember(
          conversationId,
          targetUserId
        );
        return;
      }
      throwError(ErrorType.CONFLICT, { message: "User is already a member" });
    }

    const newMember: ConversationMember = {
      conversation: new ObjectId(conversationId),
      user: new ObjectId(targetUserId),
      role: MemberRole.MEMBER,
      joinedAt: new Date(),
      isActive: true,
    };

    await this.conversationRepository.addMember(conversationId, newMember);
  }

  async removeMember(
    conversationId: string,
    userId: string,
    targetUserId: string
  ): Promise<void> {
    await this.getConversation(conversationId, userId);

    // Check permissions
    const members = await this.conversationRepository.getMembers(
      conversationId
    );
    const userMember = members.find((m) => m.user.toString() === userId);
    const targetMember = members.find(
      (m) => m.user.toString() === targetUserId
    );

    if (!targetMember || !targetMember.isActive) {
      throwError(ErrorType.NOT_FOUND, { message: "Member not found" });
    }

    // Can't remove owner
    if (targetMember.role === MemberRole.OWNER) {
      throwError(ErrorType.FORBIDDEN, { message: "Cannot remove owner" });
    }

    // Permission check
    if (
      !userMember ||
      (userMember.role !== MemberRole.ADMIN &&
        userMember.role !== MemberRole.OWNER)
    ) {
      throwError(ErrorType.FORBIDDEN, { message: "Insufficient permissions" });
    }

    await this.conversationRepository.removeMember(
      conversationId,
      targetUserId
    );
  }

  async updateMemberRole(
    conversationId: string,
    userId: string,
    targetUserId: string,
    role: MemberRole
  ): Promise<void> {
    await this.getConversation(conversationId, userId);

    // Only owner can change roles
    const members = await this.conversationRepository.getMembers(
      conversationId
    );
    const userMember = members.find((m) => m.user.toString() === userId);

    if (!userMember || userMember.role !== MemberRole.OWNER) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Only owner can change roles",
      });
    }

    // Can't change owner role
    if (role === MemberRole.OWNER) {
      throwError(ErrorType.FORBIDDEN, { message: "Cannot assign owner role" });
    }

    await this.conversationRepository.updateMemberRole(
      conversationId,
      targetUserId,
      role
    );
  }

  async leaveConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Cannot leave direct conversation",
      });
    }

    // Check if user is owner
    const members = await this.conversationRepository.getMembers(
      conversationId
    );
    const userMember = members.find((m) => m.user.toString() === userId);

    if (userMember?.role === MemberRole.OWNER) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Owner cannot leave. Transfer ownership first.",
      });
    }

    await this.conversationRepository.removeMember(conversationId, userId);
  }

  async sendMessage(data: SendMessageData): Promise<Message> {
    // Verify user is participant
    await this.getConversation(data.conversationId, data.senderId);

    // If replying to a message, verify it exists
    if (data.replyTo) {
      const replyMessage = await this.messageRepository.findById(data.replyTo);
      if (
        !replyMessage ||
        replyMessage.conversationId.toString() !== data.conversationId
      ) {
        throwError(ErrorType.NOT_FOUND, { message: "Reply message not found" });
      }
    }

    const message: Message = {
      conversationId: new ObjectId(data.conversationId),
      sender: new ObjectId(data.senderId),
      content: data.content,
      type: data.type,
      replyTo: data.replyTo ? new ObjectId(data.replyTo) : undefined,
      attachments: data.attachments?.map((att) => ({
        _id: new ObjectId(),
        name: att.name,
        type: att.type,
        url: att.url,
        size: att.size,
        mimeType: att.mimeType,
      })),
      isEdited: false,
      isDeleted: false,
      readBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await this.messageRepository.create(message);

    // Generate last message text and update conversation
    const lastMessageText = this.generateLastMessageText(created);
    await this.conversationRepository.updateLastActivity(
      data.conversationId,
      lastMessageText
    );

    return created;
  }

  async getMessage(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throwError(ErrorType.NOT_FOUND, { message: "Message not found" });
    }

    // Verify user has access to this conversation
    await this.getConversation(message.conversationId.toString(), userId);

    return message;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ messages: Message[]; total: number }> {
    // Verify access
    await this.getConversation(conversationId, userId);

    const skip = (page - 1) * limit;
    const messages = await this.messageRepository.findByConversation(
      conversationId,
      skip,
      limit
    );

    // For total count, we'd need a separate method
    const total = messages.length; // Simplified

    return { messages, total };
  }

  async editMessage(
    id: string,
    userId: string,
    content: string
  ): Promise<Message> {
    const message = await this.getMessage(id, userId);

    // Only sender can edit
    if (message.sender.toString() !== userId) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Can only edit your own messages",
      });
    }

    // Can't edit system messages
    if (message.type === MessageType.SYSTEM) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Cannot edit system messages",
      });
    }

    const updatedMessage = await this.messageRepository.update(id, { content });

    // Update last message text if this is the latest message
    const conversation = await this.conversationRepository.findById(
      message.conversationId.toString()
    );

    if (conversation && conversation.lastMessage) {
      // Check if this is the latest message by comparing timestamps
      const latestMessages = await this.messageRepository.findByConversation(
        message.conversationId.toString(),
        0,
        1
      );

      if (
        latestMessages.length > 0 &&
        latestMessages[0]._id?.toString() === id
      ) {
        const newLastMessageText = this.generateLastMessageText(updatedMessage);
        await this.conversationRepository.updateLastActivity(
          message.conversationId.toString(),
          newLastMessageText
        );
      }
    }

    return updatedMessage;
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    const message = await this.getMessage(id, userId);

    // Only sender can delete (or admins in group chats)
    if (message.sender.toString() !== userId) {
      // Check if user is admin/owner in group
      const members = await this.conversationRepository.getMembers(
        message.conversationId.toString()
      );
      const userMember = members.find((m) => m.user.toString() === userId);

      if (
        !userMember ||
        (userMember.role !== MemberRole.ADMIN &&
          userMember.role !== MemberRole.OWNER)
      ) {
        throwError(ErrorType.FORBIDDEN, {
          message: "Insufficient permissions",
        });
      }
    }

    await this.messageRepository.delete(id);
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.getMessage(messageId, userId);
    await this.messageRepository.markAsRead(messageId, userId);
  }

  async searchMessages(
    query: string,
    userId: string,
    conversationId?: string
  ): Promise<Message[]> {
    return this.messageRepository.search(query, conversationId, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Get all user conversations and sum unread counts
    const conversations = await this.conversationRepository.findByParticipant(
      userId
    );
    let totalUnread = 0;

    for (const conversation of conversations) {
      const unread = await this.messageRepository.getUnreadCount(
        conversation._id!.toString(),
        userId
      );
      totalUnread += unread;
    }

    return totalUnread;
  }
}
