import { Elysia } from "elysia";
import { container } from "../../injection/Container";
import { DIToken } from "../enum/DIToken";
import { AuthService } from "../../infrastructure/service/AuthService";
import { UserService } from "../../infrastructure/service/UserService";
import { User } from "../../domain/entity/User";

export interface AuthContext {
  user: User;
  userId: string;
  isAuthenticated: true;
}

export interface GuestContext {
  user: null;
  userId: null;
  isAuthenticated: false;
}

export type UserContext = AuthContext | GuestContext;

export const authContext = new Elysia({ name: "auth-context" }).derive(
  async ({ cookie, headers }) => {
    try {
      const token =
        cookie.accessToken?.value ||
        headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return {
          user: null,
          userId: null,
          isAuthenticated: false,
        };
      }

      const authService = container.resolve<AuthService>(DIToken.AUTH_SERVICE);
      const userService = container.resolve<UserService>(DIToken.USER_SERVICE);

      // Verify token
      const payload = await authService.verifyToken(token);

      if (!payload?.sub) {
        return {
          user: null,
          userId: null,
          isAuthenticated: false,
        };
      }

      // Lấy thông tin user
      const user = await userService.findById(payload.sub);

      if (!user) {
        return {
          user: null,
          userId: null,
          isAuthenticated: false,
        };
      }

      return {
        user,
        userId: user._id!.toString(),
        isAuthenticated: true,
      };
    } catch (error) {
      return {
        user: null,
        userId: null,
        isAuthenticated: false,
      };
    }
  }
);
