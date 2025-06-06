import { Db, ObjectId } from "mongodb";
import { DatabaseConstant } from "../../common/constant/DatabaseConstant";
import { Action, Resource, Role } from "../../domain/entity/User";

import { IRoleRepository } from "../../domain/repository/IRoleRepository";
import { DIToken } from "../../common/enum/DIToken";

export class MongoRoleRepository implements IRoleRepository {
  constructor(private db: Db) {}

  async findById(id: string): Promise<Role | null> {
    return this.db
      .collection<Role>(DatabaseConstant.ROLE_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
  }

  async getUserRoleWithPermissions(userId: string): Promise<Role | null> {
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
        { $unwind: "$role" },
      ])
      .toArray();

    return results.length > 0 ? results[0].role : null;
  }

  async hasPermission(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
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
        { $unwind: "$role" },
        { $project: { "role.permissions": 1 } },
      ])
      .toArray();

    if (results.length === 0) {
      return false;
    }

    const permissions = results[0].role.permissions;
    return permissions.some(
      (permission: { resource: Resource; actions: Action[] }) =>
        permission.resource === resource && permission.actions.includes(action)
    );
  }
}
