import { TokenPayload } from "../entity/TokenPayLoad";
import { User } from "../entity/User";

export interface IAuthService {
  signUp(username: string, email: string, password: string): Promise<void>;
  signIn(
    identifier: string,
    password: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  signOut(userId: string): Promise<void>;
  refreshToken(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
  googleAuth(googleToken: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }>;
  verifyToken(token: string): Promise<TokenPayload | null>;
  generateResetToken(email: string): Promise<string>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
