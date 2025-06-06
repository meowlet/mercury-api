import { Action, Resource, Role } from "../entity/User";

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  getUserRoleWithPermissions(userId: string): Promise<Role | null>;
  hasPermission(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean>;
}
