import { IRoleService } from "../../domain/service/IRoleService";
import { IRoleRepository } from "../../domain/repository/IRoleRepository";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import { Action, Resource, Role } from "../../domain/entity/User";
import { ErrorType, throwError } from "../../common/error/AppError";

export class RoleService implements IRoleService {
  constructor(
    private roleRepository: IRoleRepository,
    private userRepository: IUserRepository
  ) {}

  async findById(id: string): Promise<Role | null> {
    return this.roleRepository.findById(id);
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findByName(name);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const { name, permissions } = roleData;

    // Check if role already exists
    const existingRole =
      (await this.roleRepository.findByName(name!)) ||
      (await this.roleRepository.findByCode(roleData.code!));
    if (existingRole) {
      throwError(ErrorType.CONFLICT, {
        message: "Role with this name or code already exists",
      });
    }

    return this.roleRepository.create({
      name: name as string,
      description: roleData.description,
      code: roleData.code as string,
      permissions: permissions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throwError(ErrorType.NOT_FOUND, { message: "Role not found" });
    }

    // If updating name, check for conflicts
    if (updates.name && updates.name !== role.name) {
      const existingRole = await this.roleRepository.findByName(updates.name);
      if (existingRole) {
        throwError(ErrorType.CONFLICT, {
          message: "Role with this name already exists",
        });
      }
    }

    // If updating code, check for conflicts
    if (updates.code && updates.code !== role.code) {
      const existingRole = await this.roleRepository.findByCode(updates.code);
      if (existingRole) {
        throwError(ErrorType.CONFLICT, {
          message: "Role with this code already exists",
        });
      }
    }

    return this.roleRepository.update(id, updates);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throwError(ErrorType.NOT_FOUND, { message: "Role not found" });
    }

    // TODO: Check if role is being used by any users
    // You might want to prevent deletion or reassign users to a default role

    await this.roleRepository.delete(id);
  }

  async hasPermission(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<void> {
    const userRole = await this.roleRepository.findUserRole(userId);

    if (!userRole || !userRole.permissions) {
      throwError(ErrorType.FORBIDDEN, {
        message: "User does not have any role or permissions",
      });
    }

    const hasPermission = userRole.permissions.some(
      (permission) =>
        permission.resource === resource && permission.actions.includes(action)
    );

    if (!hasPermission) {
      throwError(ErrorType.FORBIDDEN, {
        message: "User does not have permission",
      });
    }
  }

  async getUserRoleWithPermissions(userId: string): Promise<Role | null> {
    return this.roleRepository.findUserRole(userId);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    // Validate user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throwError(ErrorType.USER_NOT_FOUND);
    }

    // Validate role exists
    const roleExists = await this.roleRepository.exists(roleId);
    if (!roleExists) {
      throwError(ErrorType.NOT_FOUND, { message: "Role not found" });
    }

    await this.roleRepository.assignRoleToUser(userId, roleId);
  }

  async removeRoleFromUser(userId: string): Promise<void> {
    // Validate user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throwError(ErrorType.USER_NOT_FOUND);
    }

    await this.roleRepository.removeRoleFromUser(userId);
  }

  validateRolePermissions(permissions: any[]): boolean {
    if (!Array.isArray(permissions)) {
      return false;
    }

    return permissions.every((permission) => {
      return (
        permission &&
        typeof permission === "object" &&
        Object.values(Resource).includes(permission.resource) &&
        Array.isArray(permission.actions) &&
        permission.actions.every((action: any) =>
          Object.values(Action).includes(action)
        )
      );
    });
  }

  async canUserPerformAction(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    // This is an alias for hasPermission with additional business logic if needed
    try {
      await this.hasPermission(userId, resource, action);
      return true;
    } catch (error: any) {
      if (error.type === ErrorType.FORBIDDEN) {
        return false;
      }
      throw error;
    }
  }
}
