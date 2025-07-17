import { IUserService } from "../../domain/service/IUserService";
import { DIToken } from "../../common/enum/DIToken";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import { Action, Resource, User } from "../../domain/entity/User";
import { ErrorType, throwError } from "../../common/error/AppError";
import { ObjectId } from "mongodb";
import { UserRepository } from "../repository/UserRepository";
import { IRoleRepository } from "../../domain/repository/IRoleRepository";
import { t } from "elysia";

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(
    page: number,
    limit: number
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const users = await this.userRepository.findAll(skip, limit);
    const total = await this.userRepository.countAll();

    return { users, total };
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser =
      (await this.userRepository.findByEmail(email!)) ||
      (await this.userRepository.findByUsername(username!));

    if (existingUser) {
      throwError(ErrorType.USER_EXISTS);
    }

    // Hash password
    const hashedPassword = await Bun.password.hash(password!);

    return this.userRepository.create({
      ...userData,
      username: username as string,
      email: email as string,
      isPremium: false,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throwError(ErrorType.NOT_FOUND);
    }

    // Check if username is being updated and already exists
    if (updates.username && updates.username !== user.username) {
      const existingUserWithUsername = await this.userRepository.findByUsername(
        updates.username
      );
      if (
        existingUserWithUsername &&
        existingUserWithUsername._id?.toString() !== id
      ) {
        throwError(ErrorType.USER_EXISTS);
      }
    }

    // Check if email is being updated and already exists
    if (updates.email && updates.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findByEmail(
        updates.email
      );
      if (
        existingUserWithEmail &&
        existingUserWithEmail._id?.toString() !== id
      ) {
        throwError(ErrorType.USER_EXISTS);
      }
    }

    // Update the updatedAt field
    updates.updatedAt = new Date();

    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throwError(ErrorType.NOT_FOUND);
    }

    await this.userRepository.delete(id);
  }

  async setUserOnline(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isOnline: true,
      lastSeen: new Date(),
      updatedAt: new Date(),
    });
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isOnline: false,
      lastSeen: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastSeen: new Date(),
      updatedAt: new Date(),
    });
  }

  async getOnlineUsers(): Promise<User[]> {
    return this.userRepository.findByStatus(true);
  }
}
