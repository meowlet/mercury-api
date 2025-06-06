import { User } from "../entity/User";

export interface IUserService {
  findById(id: string): Promise<User | null>;
  findAll(page: number, limit: number): Promise<{ users: User[], total: number }>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}