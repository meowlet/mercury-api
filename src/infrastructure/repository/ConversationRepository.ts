import { Db, ObjectId } from "mongodb";
import {
  Conversation,
  ConversationMember,
  ConversationType,
  MemberRole,
} from "../../domain/entity/Chat";
import { IConversationRepository } from "../../domain/repository/IConversationRepository";
import { DatabaseConstant } from "../../common/constant/DatabaseConstant";

export class ConversationRepository implements IConversationRepository {
  constructor(private db: Db) {}

  async findById(id: string): Promise<Conversation | null> {
    return this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
  }

  async findByParticipant(
    userId: string,
    skip = 0,
    limit = 20
  ): Promise<Conversation[]> {
    return this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .find({
        participants: new ObjectId(userId),
        isActive: true,
      })
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async findDirectConversation(
    user1Id: string,
    user2Id: string
  ): Promise<Conversation | null> {
    return this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .findOne({
        type: ConversationType.DIRECT,
        participants: {
          $all: [new ObjectId(user1Id), new ObjectId(user2Id)],
          $size: 2,
        },
        isActive: true,
      });
  }

  async create(conversation: Conversation): Promise<Conversation> {
    const now = new Date();
    conversation.createdAt = now;
    conversation.updatedAt = now;
    conversation.lastActivity = now;

    const result = await this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .insertOne(conversation as any);

    return { ...conversation, _id: result.insertedId };
  }

  async update(
    id: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    updates.updatedAt = new Date();

    await this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Conversation not found after update");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: false, updatedAt: new Date() } }
      );
  }

  async addMember(
    conversationId: string,
    member: ConversationMember
  ): Promise<void> {
    // Add member to conversation participants
    await this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $addToSet: { participants: new ObjectId(member.user as string) },
          $set: { updatedAt: new Date() },
        }
      );

    // Create member record
    await this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .insertOne(member as any);
  }

  async removeMember(conversationId: string, userId: string): Promise<void> {
    // Remove from participants
    await this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $pull: { participants: new ObjectId(userId) },
          $set: { updatedAt: new Date() },
        }
      );

    // Update member record
    await this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .updateOne(
        {
          conversation: new ObjectId(conversationId),
          user: new ObjectId(userId),
        },
        {
          $set: {
            isActive: false,
            leftAt: new Date(),
          },
        }
      );
  }

  async updateMemberRole(
    conversationId: string,
    userId: string,
    role: MemberRole
  ): Promise<void> {
    await this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .updateOne(
        {
          conversation: new ObjectId(conversationId),
          user: new ObjectId(userId),
          isActive: true,
        },
        { $set: { role } }
      );
  }

  async getMembers(conversationId: string): Promise<ConversationMember[]> {
    return this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .find({
        conversation: new ObjectId(conversationId),
        isActive: true,
      })
      .toArray();
  }

  async updateLastActivity(
    conversationId: string,
    lastMessageContent?: string
  ): Promise<void> {
    const updates: any = {
      lastActivity: new Date(),
      updatedAt: new Date(),
    };

    if (lastMessageContent) {
      updates.lastMessage = lastMessageContent;
    }

    await this.db
      .collection<Conversation>(DatabaseConstant.CONVERSATION_COLLECTION)
      .updateOne({ _id: new ObjectId(conversationId) }, { $set: updates });
  }

  async getActiveMembers(
    conversationId: string
  ): Promise<ConversationMember[]> {
    return this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .find({
        conversation: new ObjectId(conversationId),
        isActive: true,
      })
      .toArray();
  }

  async deactivateMember(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .updateOne(
        {
          conversation: new ObjectId(conversationId),
          user: new ObjectId(userId),
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            leftAt: new Date(),
          },
        }
      );
  }

  async reactivateMember(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await this.db
      .collection<ConversationMember>(
        DatabaseConstant.CONVERSATION_MEMBER_COLLECTION
      )
      .updateOne(
        {
          conversation: new ObjectId(conversationId),
          user: new ObjectId(userId),
          isActive: false,
        },
        {
          isActive: true,
          $unset: { leftAt: 1 },
          joinedAt: new Date(),
        }
      );
  }
}
