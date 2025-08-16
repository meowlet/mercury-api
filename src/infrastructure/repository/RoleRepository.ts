import { Db, ObjectId } from "mongodb";
import { DatabaseConstant } from "../../common/constant/DatabaseConstant";
import { Role } from "../../domain/entity/User";
import { IRoleRepository } from "../../domain/repository/IRoleRepository";

export class RoleRepository implements IRoleRepository {
  constructor(private db: Db) {}

  async findById(id: string): Promise<Role | null> {
    return this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .findOne({ name });
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .findOne({ code });
  }

  async findAll(): Promise<Role[]> {
    return this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .find({})
      .toArray();
  }

  async create(role: Role): Promise<Role> {
    const now = new Date();
    role.createdAt = now;
    role.updatedAt = now;

    const result = await this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .insertOne(role as any);

    return { ...role, _id: result.insertedId };
  }

  async update(id: string, updates: Partial<Role>): Promise<Role> {
    updates.updatedAt = new Date();

    await this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Role not found after update");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .countDocuments({ _id: new ObjectId(id) });
    return count > 0;
  }

  async findUserRole(userId: string): Promise<Role | null> {
    const results = await this.db
      .collection(DatabaseConstant.USER_COLLECTION)
      .aggregate([
        { $match: { _id: new ObjectId(userId) } },
        {
          $lookup: {
            from: DatabaseConstant.ROLE_COLLECTION,
            localField: "role",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
        { $project: { role: 1 } },
      ])
      .toArray();

    return results.length > 0 && results[0].role ? results[0].role : null;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db.collection(DatabaseConstant.USER_COLLECTION).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: new ObjectId(roleId),
          updatedAt: new Date(),
        },
      }
    );
  }

  async removeRoleFromUser(userId: string): Promise<void> {
    await this.db.collection(DatabaseConstant.USER_COLLECTION).updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: { role: "" },
        $set: { updatedAt: new Date() },
      }
    );
  }
}
