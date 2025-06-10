import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { container } from "../../injection/Container";
import { DIToken } from "../../common/enum/DIToken";
import { IAuthService } from "../../domain/service/IAuthService";
import { ErrorType, throwError } from "../../common/error/AppError";

export const AuthMiddleware = new Elysia({ name: "auth-middleware" })
  .use(bearer())
  .derive(async ({ bearer }) => {
    if (!bearer) {
      throwError(ErrorType.UNAUTHORIZED, {
        message: "Authorization token is required",
      });
    }

    const authService = container.resolve<IAuthService>(DIToken.AUTH_SERVICE);
    const payload = await authService.verifyToken(bearer);

    if (!payload) {
      throwError(ErrorType.INVALID_TOKEN, {
        message: "Invalid or expired token",
      });
    }

    return {
      userId: payload.sub,
      tokenPayload: payload,
    };
  })
  .as("global");
