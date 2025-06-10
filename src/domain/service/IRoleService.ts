import { Action, Resource, Role } from "../entity/User";

export interface IRoleService {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  createRole(roleData: Partial<Role>): Promise<Role>;
  updateRole(id: string, updates: Partial<Role>): Promise<Role>;
  deleteRole(id: string): Promise<void>;

  // Permission checking business logic
  hasPermission(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<void>;

  getUserRoleWithPermissions(userId: string): Promise<Role | null>;

  // Role assignment business logic
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string): Promise<void>;

  // Role validation business logic
  validateRolePermissions(permissions: any[]): boolean;
  canUserPerformAction(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean>;
}
