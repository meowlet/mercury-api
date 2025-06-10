import { Role } from "../entity/User";

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  create(role: Role): Promise<Role>;
  update(id: string, updates: Partial<Role>): Promise<Role>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // User-Role relationship methods
  findUserRole(userId: string): Promise<Role | null>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string): Promise<void>;
}
