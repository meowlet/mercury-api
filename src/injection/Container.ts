import { DIContainer } from "./DIContainer";
import { DIToken } from "../common/enum/DIToken";

// Database
import { MongoDatabase } from "../infrastructure/database/Database";

// Repositories
import { MongoUserRepository } from "../infrastructure/repository/UserRepository";
import { MongoRoleRepository } from "../infrastructure/repository/RoleRepository";
import { EmailRepository } from "../infrastructure/repository/EmailRepository";

// Services
import { AuthService } from "../infrastructure/service/AuthService";
import { UserService } from "../infrastructure/service/UserService";
import { EmailService } from "../infrastructure/service/EmailService";

// Controllers
import { AuthController } from "../presentation/controller/AuthController";
import { UserController } from "../presentation/controller/UserController";

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
      (database: MongoDatabase) =>
        new MongoUserRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    this.register(
      DIToken.ROLE_REPOSITORY,
      (database: MongoDatabase) =>
        new MongoRoleRepository(database.getDatabase()),
      { dependencies: [DIToken.DATABASE] }
    );

    this.registerClass(DIToken.EMAIL_REPOSITORY, EmailRepository);

    // Services
    this.register(
      DIToken.EMAIL_SERVICE,
      (emailRepo: any) => new EmailService(emailRepo),
      { dependencies: [DIToken.EMAIL_REPOSITORY] }
    );

    this.register(
      DIToken.AUTH_SERVICE,
      (userRepo: any, emailService: any) =>
        new AuthService(userRepo, emailService),
      { dependencies: [DIToken.USER_REPOSITORY, DIToken.EMAIL_SERVICE] }
    );

    this.register(
      DIToken.USER_SERVICE,
      (userRepo: any) => new UserService(userRepo),
      { dependencies: [DIToken.USER_REPOSITORY] }
    );

    // Controllers
    this.register(
      DIToken.AUTH_CONTROLLER,
      (authService: any) => new AuthController(authService),
      { dependencies: [DIToken.AUTH_SERVICE] }
    );

    this.register(
      DIToken.USER_CONTROLLER,
      (userService: any) => new UserController(userService),
      { dependencies: [DIToken.USER_SERVICE] }
    );
  }

  async initialize() {
    // Khởi tạo database connection
    const database = this.resolve<MongoDatabase>(DIToken.DATABASE);
    await database.connect();
  }
}

export const container = new Container();
