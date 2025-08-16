import { Elysia, t } from "elysia";
import { IUserService } from "../../domain/service/IUserService";
import { IRoleService } from "../../domain/service/IRoleService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import {
  ErrorType,
  throwError,
  throwErrorWithMessage,
} from "../../common/error/AppError";
import { AuthConstant } from "../../common/constant/AuthConstant";

// Tách validation models riêng
const MeModels = new Elysia().model({
  updateMe: t.Object({
    username: t.String({
      minLength: AuthConstant.USERNAME_MIN_LENGTH,
      maxLength: AuthConstant.USERNAME_MAX_LENGTH,
      pattern: AuthConstant.USERNAME_PATTERN,
      error:
        "Username must be at least 4 characters long and can only contain lowercase letters, numbers, and underscores",
    }),
    email: t.String({
      format: "email",
      minLength: AuthConstant.EMAIL_MIN_LENGTH,
      maxLength: AuthConstant.EMAIL_MAX_LENGTH,
      error: "Invalid email format",
    }),
    fullName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    avatar: t.Optional(t.String()),
  }),
  changePassword: t.Object({
    currentPassword: t.String({ minLength: 6 }),
    newPassword: t.String({
      minLength: AuthConstant.PASSWORD_MIN_LENGTH,
      maxLength: AuthConstant.PASSWORD_MAX_LENGTH,
      pattern: AuthConstant.PASSWORD_PATTERN,
      error:
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
    }),
    confirmPassword: t.String({ minLength: 6 }),
  }),
});

export class MeController {
  constructor(private userService: IUserService) {}

  public routes() {
    return new Elysia()
      .use(MeModels) // Sử dụng MeModels thay vì UserModels
      .use(AuthMiddleware)
      .get("/me", async ({ userId }) => {
        const user = await this.userService.findById(userId);

        return ResponseFormatter.success(
          ResponseFormatter.formatUserResponse(user)
        );
      })
      .get("/me/avatar", async ({ userId }) => {
        const user = await this.userService.findById(userId);

        if (!user) {
          throwError(ErrorType.USER_NOT_FOUND);
        }

        return ResponseFormatter.success({
          avatar: user.avatar || null,
          message: "Avatar retrieved successfully",
        });
      })
      .patch(
        "/me",
        async ({ body, userId }) => {
          const updatedUser = await this.userService.updateUser(userId, body);

          return ResponseFormatter.success({
            user: ResponseFormatter.formatUserResponse(updatedUser),
            message: "Profile updated successfully",
          });
        },
        {
          body: "updateMe",
        }
      )
      .put(
        "/me/password",
        async ({ body, userId }) => {
          const { currentPassword, newPassword, confirmPassword } = body;

          // Validate password confirmation
          if (newPassword !== confirmPassword) {
            throwErrorWithMessage(
              ErrorType.INVALID_CREDENTIALS,
              "New password and confirm password do not match"
            );
          }

          // Get current user
          const user = await this.userService.findById(userId);
          if (!user || !user.password) {
            throwError(ErrorType.USER_NOT_FOUND);
          }

          // Verify current password
          const isCurrentPasswordValid = await Bun.password.verify(
            currentPassword,
            user.password
          );
          if (!isCurrentPasswordValid) {
            throwErrorWithMessage(
              ErrorType.INVALID_CREDENTIALS,
              "Current password is incorrect"
            );
          }

          // Hash new password
          const hashedNewPassword = await Bun.password.hash(newPassword);

          // Update password
          await this.userService.updateUser(userId, {
            password: hashedNewPassword,
          });

          return ResponseFormatter.success({
            message: "Password changed successfully",
          });
        },
        {
          body: "changePassword",
        }
      );
  }
}
