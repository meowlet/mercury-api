import { Elysia } from "elysia";
import { AuthController } from "./controller/AuthController";
import { container } from "../injection/Container";
import { DIToken } from "../common/enum/DIToken";
import { ChatController } from "./controller/ChatController";
import { ChatWebSocket } from "./ws/ChatWebSocket";

export class Router {
  static setup(): Elysia {
    const app = new Elysia();

    // Register all controllers
    app.use(this.setupAuthRoutes());
    app.use(this.setupUserRoutes());
    app.use(this.setupChatRoutes()); // Add chat routes
    app.use(this.setupChatWebSocket()); // Add WebSocket

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

  private static setupChatRoutes() {
    const chatController = container.resolve<ChatController>(
      DIToken.CHAT_CONTROLLER
    );
    return chatController.routes();
  }

  private static setupChatWebSocket() {
    const chatWebSocket = container.resolve<ChatWebSocket>(
      DIToken.CHAT_WEBSOCKET
    );
    return chatWebSocket.routes();
  }
}
