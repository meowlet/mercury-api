import { IUserService } from "../../domain/service/IUserService";
import { DIToken } from "../../common/enum/DIToken";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import { User } from "../../domain/entity/User";
import { ErrorType, throwError } from "../../common/error/AppError";
import { ObjectId } from "mongodb";
import { MongoUserRepository } from "../repository/UserRepository";

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(
    page: number = 1,
    limit: number = 50
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

    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throwError(ErrorType.NOT_FOUND);
    }

    await this.userRepository.delete(id);
  }
}
