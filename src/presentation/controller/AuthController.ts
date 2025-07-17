import { Elysia, t } from "elysia";
import { AuthService } from "../../infrastructure/service/AuthService";
import { DIToken } from "../../common/enum/DIToken";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { ConfigConstant } from "../../common/constant/ConfigConstant";
import { AuthConstant } from "../../common/constant/AuthConstant";
import { ref } from "process";

const authModels = new Elysia().model({
  signUp: t.Object({
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
    password: t.String({
      minLength: AuthConstant.PASSWORD_MIN_LENGTH,
      maxLength: AuthConstant.PASSWORD_MAX_LENGTH,
      pattern: AuthConstant.PASSWORD_PATTERN,
      error:
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
    }),
  }),

  signIn: t.Object({
    identifier: t.String(),
    password: t.String({}),
  }),

  refreshToken: t.Object({
    token: t.String(),
  }),

  googleAuth: t.Object({
    token: t.String(),
  }),

  forgotPassword: t.Object({
    email: t.String({
      minLength: AuthConstant.EMAIL_MIN_LENGTH,
      maxLength: AuthConstant.EMAIL_MAX_LENGTH,
      format: "email",
      error: "Invalid email format",
    }),
  }),

  resetPassword: t.Object({
    token: t.String(),
    newPassword: t.String({
      minLength: AuthConstant.PASSWORD_MIN_LENGTH,
      maxLength: AuthConstant.PASSWORD_MAX_LENGTH,
      pattern: AuthConstant.PASSWORD_PATTERN,
      error:
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
    }),
  }),
});

export class AuthController {
  constructor(private authService: AuthService) {}

  public routes() {
    return new Elysia()
      .use(authModels)
      .post(
        "/sign-up",
        async ({ body }) => {
          const { username, email, password } = body;
          await this.authService.signUp(username, email, password);
          return ResponseFormatter.success(
            null,
            "User has been created successfully"
          );
        },
        { body: "signUp" }
      )
      .post(
        "/sign-in",
        async ({ body, cookie }) => {
          const { identifier, password } = body;
          const { user, accessToken, refreshToken } =
            await this.authService.signIn(identifier, password);

          cookie.accessToken.set({
            value: accessToken,
            httpOnly: true,
            secure: ConfigConstant.BUN_ENV == "production",
            maxAge: AuthConstant.ACCESS_TOKEN_EXPIRES_IN,
          });

          cookie.refreshToken.set({
            value: refreshToken,
            httpOnly: true,
            secure: ConfigConstant.BUN_ENV == "production",
            maxAge: AuthConstant.REFRESH_TOKEN_EXPIRES_IN,
          });

          return ResponseFormatter.success({
            user: ResponseFormatter.formatUserResponse(user),
            tokens: {
              accessToken,
              refreshToken,
            },
          });
        },
        { body: "signIn" }
      )
      .post(
        "/refresh-token",
        async ({ body }) => {
          const { token } = body;
          const tokens = await this.authService.refreshToken(token);

          console.log(tokens);

          return ResponseFormatter.success(tokens);
        },
        { body: "refreshToken" }
      )
      .post(
        "/google",
        async ({ body }) => {
          const { token } = body;
          const { user, accessToken, refreshToken, isNewUser } =
            await this.authService.googleAuth(token);

          return ResponseFormatter.success({
            user: ResponseFormatter.formatUserResponse(user),
            tokens: {
              accessToken,
              refreshToken,
            },
            isNewUser,
          });
        },
        { body: "googleAuth" }
      )
      .post(
        "/forgot-password",
        async ({ body }) => {
          const { email } = body;
          await this.authService.generateResetToken(email);

          // Don't reveal whether the email exists or not for security
          return ResponseFormatter.success(
            null,
            "If your email exists in our system, you will receive a password reset link"
          );
        },
        { body: "forgotPassword" }
      )
      .post(
        "/reset-password",
        async ({ body }) => {
          const { token, newPassword } = body;
          await this.authService.resetPassword(token, newPassword);

          return ResponseFormatter.success(
            null,
            "Password has been reset successfully"
          );
        },
        { body: "resetPassword" }
      )
      .post("/sign-out", async ({ headers, cookie }) => {
        // Get user ID from token
        const token =
          headers.authorization?.replace("Bearer ", "") ||
          cookie.accessToken.value;
        if (!token) {
          return ResponseFormatter.error("No token provided", "UNAUTHORIZED");
        }

        const payload = await this.authService.verifyToken(token);
        if (!payload || !payload.sub) {
          return ResponseFormatter.error("Invalid token", "UNAUTHORIZED");
        }

        await this.authService.signOut(payload.sub);

        // Clear cookies
        cookie.accessToken.remove();
        cookie.refreshToken.remove();

        return ResponseFormatter.success(null, "Signed out successfully");
      });
  }
}
