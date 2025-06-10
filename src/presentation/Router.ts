import { Elysia } from "elysia";
import { AuthController } from "./controller/AuthController";
import { container } from "../injection/Container";
import { DIToken } from "../common/enum/DIToken";

export class Router {
  static setup(): Elysia {
    const app = new Elysia();

    // Register all controllers
    app.use(this.setupAuthRoutes());
    // app.use(this.setupChatRoutes());

    // Add more route groups as needed
    app.use(this.setupUserRoutes());
    // app.use(this.setupFictionRoutes());

    return app;
  }

  private static setupAuthRoutes() {
    const authController = container.resolve<AuthController>(
      DIToken.AUTH_CONTROLLER
    );
    return authController.routes();
  }

  private static setupUserRoutes() {
    const userController = container.resolve<AuthController>(
      DIToken.USER_CONTROLLER
    );
    return userController.routes();
  }

  // private static setupChatRoutes() {
  //   const chatController = container.resolve<ChatController>(
  //     DIToken.CHAT_CONTROLLER
  //   );
  //   return chatController.routes();
  // }

  // Add more controller setups as needed
  // private static setupUserRoutes(): Elysia { ... }
  // private static setupFictionRoutes(): Elysia { ... }
}
