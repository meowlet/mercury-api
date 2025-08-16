import { User } from "../entity/User";

export interface IUserRepository {
  findAll(skip?: number, limit?: number): Promise<User[]>;
  countAll(): Promise<number>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;
  findByResetOtp(otp: string): Promise<User | null>;
  findByStatus(isOnline: boolean): Promise<User[]>;
  create(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  updateRefreshToken(id: string, token: string): Promise<void>;
  removeRefreshToken(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
