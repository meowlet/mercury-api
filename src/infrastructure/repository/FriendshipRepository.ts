import { MongoClient, Db, ObjectId } from "mongodb";
import { IFriendshipRepository } from "../../domain/repository/IFriendshipRepository";
import { Friendship, FriendshipStatus, User } from "../../domain/entity/User";
import { ErrorType, throwError } from "../../common/error/AppError";

export class FriendshipRepository implements IFriendshipRepository {
  constructor(private db: Db) {}

  async create(friendship: Friendship): Promise<Friendship> {
    const { _id, ...friendshipData } = friendship;
    const result = await this.db.collection("friendships").insertOne({
      ...friendshipData,
      requester: new ObjectId(friendship.requester),
      addressee: new ObjectId(friendship.addressee),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    return {
      ...friendship,
      _id: result.insertedId,
    };
  }

  async findById(id: string): Promise<Friendship | null> {
    const friendship = await this.db
      .collection("friendships")
      .findOne({ _id: new ObjectId(id) });

    return friendship as Friendship | null;
  }

  async findByUsers(
    requesterId: string,
    addresseeId: string
  ): Promise<Friendship | null> {
    const friendship = await this.db.collection("friendships").findOne({
      $or: [
        {
          requester: new ObjectId(requesterId),
          addressee: new ObjectId(addresseeId),
        },
        {
          requester: new ObjectId(addresseeId),
          addressee: new ObjectId(requesterId),
        },
      ],
    });

    return friendship as Friendship | null;
  }

  async updateStatus(
    id: string,
    status: FriendshipStatus
  ): Promise<Friendship> {
    const result = await this.db.collection("friendships").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      throwError(ErrorType.NOT_FOUND, { message: "Friendship not found" });
    }

    return result as Friendship;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection("friendships")
      .deleteOne({ _id: new ObjectId(id) });
  }

  async getFriendsByUserId(userId: string): Promise<User[]> {
    const pipeline = [
      {
        $match: {
          $or: [
            { requester: new ObjectId(userId) },
            { addressee: new ObjectId(userId) },
          ],
          status: FriendshipStatus.ACCEPTED,
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            friendId: {
              $cond: {
                if: { $eq: ["$requester", new ObjectId(userId)] },
                then: "$addressee",
                else: "$requester",
              },
            },
          },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$friendId"] } } },
            {
              $project: { password: 0, refreshToken: 0, resetPasswordToken: 0 },
            },
          ],
          as: "friend",
        },
      },
      {
        $unwind: "$friend",
      },
      {
        $addFields: {
          "friend.friendshipId": "$_id",
        },
      },
      {
        $replaceRoot: { newRoot: "$friend" },
      },
    ];

    const friends = await this.db
      .collection("friendships")
      .aggregate(pipeline)
      .toArray();

    return friends as User[];
  }

  async getPendingRequestsByUserId(userId: string): Promise<Friendship[]> {
    const requests = await this.db
      .collection("friendships")
      .aggregate([
        {
          $match: {
            addressee: new ObjectId(userId),
            status: FriendshipStatus.PENDING,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "requester",
            foreignField: "_id",
            as: "requesterInfo",
            pipeline: [
              {
                $project: {
                  password: 0,
                  refreshToken: 0,
                  resetPasswordToken: 0,
                },
              },
            ],
          },
        },
        {
          $unwind: "$requesterInfo",
        },
      ])
      .toArray();

    return requests as Friendship[];
  }

  async getSentRequestsByUserId(userId: string): Promise<Friendship[]> {
    const requests = await this.db
      .collection("friendships")
      .aggregate([
        {
          $match: {
            requester: new ObjectId(userId),
            status: FriendshipStatus.PENDING,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "addressee",
            foreignField: "_id",
            as: "addresseeInfo",
            pipeline: [
              {
                $project: {
                  password: 0,
                  refreshToken: 0,
                  resetPasswordToken: 0,
                },
              },
            ],
          },
        },
        {
          $unwind: "$addresseeInfo",
        },
      ])
      .toArray();

    return requests as Friendship[];
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const users = await this.db
      .collection("users")
      .find({
        _id: { $ne: new ObjectId(currentUserId) },
        $or: [
          { username: { $regex: query, $options: "i" } },
          { fullName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      })
      .project({ password: 0, refreshToken: 0, resetPasswordToken: 0 })
      .limit(20)
      .toArray();

    return users as User[];
  }

  async getFriendshipByUsers(
    userId: string,
    friendId: string
  ): Promise<Friendship | null> {
    const friendship = await this.db.collection("friendships").findOne({
      $or: [
        {
          requester: new ObjectId(userId),
          addressee: new ObjectId(friendId),
        },
        {
          requester: new ObjectId(friendId),
          addressee: new ObjectId(userId),
        },
      ],
      status: FriendshipStatus.ACCEPTED,
    });

    return friendship as Friendship | null;
  }

  async getBlockedUsersByUserId(userId: string): Promise<User[]> {
    const pipeline = [
      {
        $match: {
          requester: new ObjectId(userId),
          status: FriendshipStatus.BLOCKED,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "addressee",
          foreignField: "_id",
          as: "blockedUser",
          pipeline: [
            {
              $project: {
                password: 0,
                refreshToken: 0,
                resetPasswordToken: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$blockedUser",
      },
      {
        $addFields: {
          "blockedUser.friendshipId": "$_id",
          "blockedUser.blockedAt": "$createdAt",
        },
      },
      {
        $replaceRoot: { newRoot: "$blockedUser" },
      },
    ];

    const blockedUsers = await this.db
      .collection("friendships")
      .aggregate(pipeline)
      .toArray();

    return blockedUsers as User[];
  }
}
