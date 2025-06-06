import { MongoRoleRepository } from "../repository/RoleRepository";
import { Action, Resource, User } from "../../domain/entity/User";
import { sign, verify } from "jsonwebtoken";
import crypto from "crypto";
import { TokenPayload } from "../../domain/entity/TokenPayLoad";
import { OAuth2Client } from "google-auth-library";
import { AuthConstant } from "../../common/constant/AuthConstant";
import {
  ErrorType,
  throwError,
  throwErrorWithMessage,
} from "../../common/error/AppError";
import { DIToken } from "../../common/enum/DIToken";
import { IAuthService } from "../../domain/service/IAuthService";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import { IEmailService } from "../../domain/service/IEmailService";

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}

  async signUp(
    username: string,
    email: string,
    password: string
  ): Promise<void> {
    // Check if user already exists
    const existingUser =
      (await this.userRepository.findByEmail(email)) ||
      (await this.userRepository.findByUsername(username));

    if (existingUser) {
      throwError(ErrorType.USER_EXISTS);
    }

    // Hash password
    const hashedPassword = await Bun.password.hash(password);

    // Create new user
    await this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      isPremium: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.emailService.sendWelcomeEmail(email, username);
  }

  async signIn(
    identifier: string,
    password: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Find user by email or username
    const user =
      (await this.userRepository.findByEmail(identifier)) ||
      (await this.userRepository.findByUsername(identifier));

    if (!user || !user.password) {
      // Just use the default message
      throwError(ErrorType.USER_NOT_FOUND);
    }

    // Check password
    const isPasswordValid = await Bun.password.verify(password, user.password);
    if (!isPasswordValid) {
      throwError(ErrorType.INVALID_CREDENTIALS, {
        reason: "password_mismatch",
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id!.toString());
    const refreshToken = this.generateRefreshToken(user._id!.toString());

    // Save refresh token
    await this.userRepository.updateRefreshToken(
      user._id!.toString(),
      refreshToken
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const payload = await this.verifyToken(token);

    if (!payload || !payload.sub) {
      throwError(ErrorType.INVALID_TOKEN);
    }

    const userId = payload.sub;

    // Check if user exists
    const userExists = await this.userRepository.exists(userId);
    if (!userExists) {
      throwError(ErrorType.USER_NOT_FOUND);
    }

    // Generate new tokens
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Update refresh token
    await this.userRepository.updateRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async googleAuth(googleToken: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const client = new OAuth2Client(AuthConstant.GOOGLE_CLIENT_ID);

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: AuthConstant.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throwErrorWithMessage(ErrorType.INVALID_TOKEN, "Invalid Google token");
    }

    const { sub: googleId, email, name } = payload;

    // Find user by Google ID
    let user = await this.userRepository.findByGoogleId(googleId!);
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email
      user = await this.userRepository.findByEmail(email!);

      if (user) {
        // Link Google account to existing user
        user = await this.userRepository.update(user._id!.toString(), {
          googleId: googleId,
          updatedAt: new Date(),
        });
      } else {
        // Create new user with Google info
        isNewUser = true;
        user = await this.userRepository.create({
          email: email!,
          username: `user_${crypto.randomBytes(4).toString("hex")}`,
          fullName: name,
          googleId: googleId,
          isPremium: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id!.toString());
    const refreshToken = this.generateRefreshToken(user._id!.toString());

    // Save refresh token
    await this.userRepository.updateRefreshToken(
      user._id!.toString(),
      refreshToken
    );

    return {
      user,
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = verify(token, AuthConstant.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async generateResetToken(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Just return a dummy token that won't work
      return crypto.randomBytes(32).toString("hex");
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save to user
    await this.userRepository.update(user._id!.toString(), {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetExpiry,
    });

    // Send password reset email
    this.emailService.sendPasswordResetEmail(email, resetToken);

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with this reset token and valid expiry
    const user = await this.userRepository.findByResetToken(token);

    if (!user) {
      // Use the default message "Invalid token"
      throwError(ErrorType.INVALID_TOKEN);
    }

    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      // Use a custom, more specific message
      throwErrorWithMessage(
        ErrorType.INVALID_TOKEN,
        "Password reset token has expired"
      );
    }

    // Hash new password
    const hashedPassword = await Bun.password.hash(newPassword);

    // Update password and clear reset token
    await this.userRepository.update(user._id!.toString(), {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpiry: undefined,
    });
  }

  // Helper methods
  private generateAccessToken(userId: string): string {
    return sign({ sub: userId }, AuthConstant.JWT_SECRET, {
      expiresIn: AuthConstant.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  private generateRefreshToken(userId: string): string {
    return sign({ sub: userId }, AuthConstant.JWT_SECRET, {
      expiresIn: AuthConstant.REFRESH_TOKEN_EXPIRES_IN,
    });
  }
}
