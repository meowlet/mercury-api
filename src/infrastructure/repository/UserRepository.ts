import { Db, ObjectId } from "mongodb";
import { User } from "../../domain/entity/User";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import { DatabaseConstant } from "../../common/constant/DatabaseConstant";
import { DIToken } from "../../common/enum/DIToken";

export class UserRepository implements IUserRepository {
  constructor(private db: Db) {}

  async findAll(skip?: number, limit?: number): Promise<User[]> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .find()
      .skip(skip || 0)
      .limit(limit || 10)
      .toArray();
  }

  async countAll(): Promise<number> {
    return this.db
      .collection(DatabaseConstant.USER_COLLECTION)
      .countDocuments();
  }

  async findById(id: string): Promise<User | null> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .findOne({ username: username });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .findOne({ email: email });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .findOne({ googleId: googleId });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .findOne({ resetPasswordToken: token });
  }

  async findByStatus(isOnline: boolean): Promise<User[]> {
    return this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .find({ isOnline: isOnline })
      .toArray();
  }

  async create(user: User): Promise<User> {
    const now = new Date();
    user.createdAt = now;
    user.updatedAt = now;

    const result = await this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .insertOne(user as any);

    return { ...user, _id: result.insertedId };
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    updates.updatedAt = new Date();

    await this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("User not found after update");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
  }

  async updateRefreshToken(id: string, token: string): Promise<void> {
    await this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { refreshToken: token, updatedAt: new Date() } }
      );
  }

  async removeRefreshToken(id: string): Promise<void> {
    await this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { refreshToken: undefined, updatedAt: new Date() } }
      );
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db
      .collection<User>(DatabaseConstant.USER_COLLECTION)
      .countDocuments({ _id: new ObjectId(id) });
    return count > 0;
  }
}
