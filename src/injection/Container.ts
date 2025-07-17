import { DIContainer } from "./DIContainer";
import { DIToken } from "../common/enum/DIToken";

// Database
import { MongoDatabase } from "../infrastructure/database/Database";

// Repositories
import { UserRepository } from "../infrastructure/repository/UserRepository";
import { RoleRepository } from "../infrastructure/repository/RoleRepository";
import { EmailRepository } from "../infrastructure/repository/EmailRepository";
import { ConversationRepository } from "../infrastructure/repository/ConversationRepository";
import { MessageRepository } from "../infrastructure/repository/MessageRepository";
import { FriendshipRepository } from "../infrastructure/repository/FriendshipRepository";

// Services
import { AuthService } from "../infrastructure/service/AuthService";
import { UserService } from "../infrastructure/service/UserService";
import { EmailService } from "../infrastructure/service/EmailService";
import { FileUploadService } from "../infrastructure/service/FileUploadService";
import { FriendshipService } from "../infrastructure/service/FriendshipService";

// Controllers
import { AuthController } from "../presentation/controller/AuthController";
import { UserController } from "../presentation/controller/UserController";
import { UploadController } from "../presentation/controller/UploadController";
import { FriendshipController } from "../presentation/controller/FriendshipController";
import { RoleService } from "../infrastructure/service/RoleService";
import { ChatController } from "../presentation/controller/ChatController";
import { ChatWebSocket } from "../presentation/ws/ChatWebSocket";
import { ChatService } from "../infrastructure/service/ChatService";
import { MeController } from "../presentation/controller/MeController";

// WebSockets

class Container extends DIContainer {
  constructor() {
    super();
    this.setupServices();
  }

  private setupServices() {
    // Database
    this.registerClass(DIToken.DATABASE, MongoDatabase);

    // Repositories
    this.register(
      DIToken.USER_REPOSITORY,
      (database: MongoDatabase) => new UserRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    this.register(
      DIToken.ROLE_REPOSITORY,
      (database: MongoDatabase) => new RoleRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    this.registerClass(DIToken.EMAIL_REPOSITORY, EmailRepository);

    this.register(
      DIToken.CONVERSATION_REPOSITORY,
      (database: MongoDatabase) =>
        new ConversationRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    this.register(
      DIToken.MESSAGE_REPOSITORY,
      (database: MongoDatabase) =>
        new MessageRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    this.register(
      DIToken.FRIENDSHIP_REPOSITORY,
      (database: MongoDatabase) =>
        new FriendshipRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    // Services
    this.register(
      DIToken.EMAIL_SERVICE,
      (emailRepo: any) => new EmailService(emailRepo),
      { dependencies: [DIToken.EMAIL_REPOSITORY] }
    );

    this.register(
      DIToken.USER_SERVICE,
      (userRepo: any) => new UserService(userRepo),
      {
        dependencies: [DIToken.USER_REPOSITORY],
        singleton: false, // Tạo instance mới cho mỗi request
      }
    );

    this.register(
      DIToken.ROLE_SERVICE,
      (roleRepo: any, userRepo: any) => new RoleService(roleRepo, userRepo),
      { dependencies: [DIToken.ROLE_REPOSITORY, DIToken.USER_REPOSITORY] }
    );

    this.register(
      DIToken.AUTH_SERVICE,
      (userRepo: any, emailService: any, userService: any) =>
        new AuthService(userRepo, emailService, userService),
      {
        dependencies: [
          DIToken.USER_REPOSITORY,
          DIToken.EMAIL_SERVICE,
          DIToken.USER_SERVICE,
        ],
        singleton: false, // Tạo instance mới cho mỗi request
      }
    );

    this.register(
      DIToken.CHAT_SERVICE,
      (conversationRepo: any, messageRepo: any, userRepo: any) =>
        new ChatService(conversationRepo, messageRepo, userRepo),
      {
        dependencies: [
          DIToken.CONVERSATION_REPOSITORY,
          DIToken.MESSAGE_REPOSITORY,
          DIToken.USER_REPOSITORY,
        ],
      }
    );

    this.register(
      DIToken.FRIENDSHIP_SERVICE,
      (friendshipRepo: any, userRepo: any) =>
        new FriendshipService(friendshipRepo, userRepo),
      {
        dependencies: [DIToken.FRIENDSHIP_REPOSITORY, DIToken.USER_REPOSITORY],
      }
    );

    // File Upload Service
    this.registerClass(DIToken.FILE_UPLOAD_SERVICE, FileUploadService);

    // Controllers
    this.register(
      DIToken.AUTH_CONTROLLER,
      (authService: any) => new AuthController(authService),
      { dependencies: [DIToken.AUTH_SERVICE] }
    );

    this.register(
      DIToken.USER_CONTROLLER,
      (userService: any, roleService: any) =>
        new UserController(userService, roleService),
      {
        dependencies: [DIToken.USER_SERVICE, DIToken.ROLE_SERVICE],
      }
    );

    this.register(
      DIToken.ME_CONTROLLER,
      (userService: any) => new MeController(userService),
      {
        dependencies: [DIToken.USER_SERVICE, DIToken.ROLE_SERVICE],
      }
    );

    this.register(
      DIToken.CHAT_CONTROLLER,
      (chatService: any, fileUploadService: any) =>
        new ChatController(chatService, fileUploadService),
      { dependencies: [DIToken.CHAT_SERVICE, DIToken.FILE_UPLOAD_SERVICE] }
    );

    this.register(
      DIToken.FRIENDSHIP_CONTROLLER,
      (friendshipService: any) => new FriendshipController(friendshipService),
      { dependencies: [DIToken.FRIENDSHIP_SERVICE] }
    );

    // Chat WebSocket
    this.register(
      DIToken.CHAT_WEBSOCKET,
      (chatService: any, userService: any) =>
        new ChatWebSocket(chatService, userService),
      { dependencies: [DIToken.CHAT_SERVICE, DIToken.USER_SERVICE] }
    );

    // Upload Controller
    this.register(
      DIToken.UPLOAD_CONTROLLER,
      (fileUploadService: any, userService: any) =>
        new UploadController(fileUploadService, userService),
      { dependencies: [DIToken.FILE_UPLOAD_SERVICE, DIToken.USER_SERVICE] }
    );
  }

  async initialize() {
    // Khởi tạo database connection
    const database = this.resolve<MongoDatabase>(DIToken.DATABASE);
    await database.connect();
  }
}

export const container = new Container();
