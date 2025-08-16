import { Elysia } from "elysia";
import { AuthController } from "./controller/AuthController";
import { container } from "../injection/Container";
import { DIToken } from "../common/enum/DIToken";
import { ChatController } from "./controller/ChatController";
import { ChatWebSocket } from "./ws/ChatWebSocket";
import { MeController } from "./controller/MeController";
import { UserController } from "./controller/UserController";
import { UploadController } from "./controller/UploadController";
import { FriendshipController } from "./controller/FriendshipController";
import { PaymentController } from "./controller/PaymentController";
import { PaymentWebhookController } from "./controller/PaymentWebhookController";

export class Router {
  static setup(): Elysia {
    const app = new Elysia();

    // Register all controllers
    app.use(this.setupAuthRoutes());
    app.use(this.setupUserRoutes());
    app.use(this.setupChatRoutes()); // Add chat routes
    app.use(this.setupMeRoutes()); // Add me routes
    app.use(this.setupUploadRoutes()); // Add upload routes
    app.use(this.setupChatWebSocket()); // Add WebSocket
    app.use(this.setupFriendshipRoutes()); // Add friendship routes
    app.use(this.setupPaymentRoutes()); // Add payment routes
    app.use(PaymentWebhookController); // Add payment webhooks

    return app;
  }

  private static setupAuthRoutes() {
    const authController = container.resolve<AuthController>(
      DIToken.AUTH_CONTROLLER
    );
    return authController.routes();
  }

  private static setupUserRoutes() {
    const userController = container.resolve<UserController>(
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

  private static setupMeRoutes() {
    const meController = container.resolve<MeController>(DIToken.ME_CONTROLLER);
    return meController.routes();
  }

  private static setupUploadRoutes() {
    const uploadController = container.resolve<UploadController>(
      DIToken.UPLOAD_CONTROLLER
    );
    return uploadController.routes();
  }

  private static setupFriendshipRoutes() {
    const friendshipController = container.resolve<FriendshipController>(
      DIToken.FRIENDSHIP_CONTROLLER
    );
    return friendshipController.routes();
  }

  private static setupPaymentRoutes() {
    const paymentController = container.resolve<PaymentController>(
      DIToken.PAYMENT_CONTROLLER
    );
    return paymentController.routes();
  }
}
