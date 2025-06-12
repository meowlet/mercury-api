import { Db, ObjectId } from "mongodb";
import { Message, ReadReceipt } from "../../domain/entity/Chat";
import { IMessageRepository } from "../../domain/repository/IMessageRepository";
import { DatabaseConstant } from "../../common/constant/DatabaseConstant";

export class MessageRepository implements IMessageRepository {
  constructor(private db: Db) {}

  async findById(id: string): Promise<Message | null> {
    return this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .findOne({
        _id: new ObjectId(id),
        isDeleted: false,
      });
  }

  async findByConversation(
    conversationId: string,
    skip = 0,
    limit = 50
  ): Promise<Message[]> {
    return this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .find({
        conversationId: new ObjectId(conversationId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async create(message: Message): Promise<Message> {
    const now = new Date();
    message.createdAt = now;
    message.updatedAt = now;
    message.isEdited = false;
    message.isDeleted = false;
    message.readBy = [];

    const result = await this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .insertOne(message as any);

    return { ...message, _id: result.insertedId };
  }

  async update(id: string, updates: Partial<Message>): Promise<Message> {
    updates.updatedAt = new Date();
    if (updates.content) {
      updates.isEdited = true;
      updates.editedAt = new Date();
    }

    await this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Message not found after update");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const readReceipt: ReadReceipt = {
      user: new ObjectId(userId),
      readAt: new Date(),
    };

    await this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .updateOne(
        {
          _id: new ObjectId(messageId),
          "readBy.userId": { $ne: new ObjectId(userId) },
        },
        {
          $push: { readBy: readReceipt },
          $set: { updatedAt: new Date() },
        }
      );
  }

  async getUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    return this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .countDocuments({
        conversationId: new ObjectId(conversationId),
        sender: { $ne: new ObjectId(userId) },
        "readBy.userId": { $ne: new ObjectId(userId) },
        isDeleted: false,
      });
  }

  async search(
    query: string,
    conversationId?: string,
    userId?: string
  ): Promise<Message[]> {
    const filter: any = {
      $text: { $search: query },
      isDeleted: false,
    };

    if (conversationId) {
      filter.conversationId = new ObjectId(conversationId);
    }

    if (userId) {
      // Only search in conversations where user is a participant
      const conversations = await this.db
        .collection(DatabaseConstant.CONVERSATION_COLLECTION)
        .find({ participants: new ObjectId(userId) })
        .project({ _id: 1 })
        .toArray();

      filter.conversationId = {
        $in: conversations.map((c) => c._id),
      };
    }

    return this.db
      .collection<Message>(DatabaseConstant.MESSAGE_COLLECTION)
      .find(filter)
      .sort({ score: { $meta: "textScore" } })
      .limit(50)
      .toArray();
  }
}
