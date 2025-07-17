import { Elysia, t } from "elysia";
import { DIToken } from "../../common/enum/DIToken";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { Action, Resource } from "../../domain/entity/User";
import { UserService } from "../../infrastructure/service/UserService";
import { IUserService } from "../../domain/service/IUserService";
import { IRoleService } from "../../domain/service/IRoleService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ErrorType, throwError } from "../../common/error/AppError";

const UserModels = new Elysia().model({
  createUser: t.Object({
    username: t.String(),
    email: t.String(),
    password: t.String(),
    fullName: t.Optional(t.String()),
    isPremium: t.Optional(t.Boolean()),
  }),

  updateUser: t.Object({
    username: t.Optional(t.String()),
    email: t.Optional(t.String()),
    fullName: t.Optional(t.String()),
    isPremium: t.Optional(t.Boolean()),
    role: t.Optional(t.String()),
    avatar: t.Optional(t.String()),
  }),

  paginationQuery: t.Object({
    page: t.Number({ default: 1 }),
    limit: t.Number({ default: 10 }),
  }),
});

export class UserController {
  constructor(
    private userService: IUserService,
    private roleService: IRoleService
  ) {}

  public routes() {
    return new Elysia()
      .use(UserModels)
      .get(
        "/uploads/attachments/:filename",
        async ({ params, set }) => {
          const { filename } = params;

          try {
            // Construct the full path to the attachment file
            const attachmentPath = `./uploads/attachments/${filename}`;
            const file = Bun.file(attachmentPath);

            // Check if file exists
            if (!(await file.exists())) {
              set.status = 404;
              return { message: "Attachment file not found" };
            }

            // Get MIME type from filename

            // Set appropriate headers
            set.headers = {
              "Content-Type": file.type || "application/octet-stream",
              "Cache-Control": "public, max-age=31536000", // Cache for 1 year
            };

            return file;
          } catch (error) {
            console.error("Error serving attachment:", error);
            set.status = 500;
            return { message: "Error serving attachment" };
          }
        },
        {
          params: t.Object({
            filename: t.String(),
          }),
          detail: {
            tags: ["Upload"],
            summary: "Get attachment file",
            description: "Serve attachment file by filename",
          },
        }
      )
      .get("/users/:id/avatar", async ({ params, set }) => {
        const user = await this.userService.findById(params.id);

        if (!user) {
          throwError(ErrorType.USER_NOT_FOUND);
        }

        if (!user.avatar) {
          set.status = 404;
          return { message: "Avatar not found" };
        }

        try {
          // Construct the full path to the avatar file
          const avatarPath = user.avatar.startsWith("./")
            ? user.avatar
            : `./${user.avatar}`;
          console.log("Avatar path:", avatarPath);
          const file = Bun.file(avatarPath);

          // Check if file exists
          if (!(await file.exists())) {
            set.status = 404;
            return { message: "Avatar file not found" };
          }

          // Set appropriate headers for PNG images
          set.headers = {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
          };

          return file;
        } catch (error) {
          console.error("Error serving avatar:", error);
          set.status = 500;
          return { message: "Error serving avatar" };
        }
      })
      .use(AuthMiddleware)
      .get(
        "/users",
        async ({ query, userId }) => {
          // Check permissions
          await this.roleService.hasPermission(
            userId,
            Resource.USER,
            Action.READ
          );

          const { page, limit } = query;
          const { users, total } = await this.userService.findAll(page, limit);

          return ResponseFormatter.success({
            users: users.map((user) =>
              ResponseFormatter.formatUserResponse(user)
            ),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          });
        },
        {
          query: "paginationQuery",
        }
      )
      .get("/users/:id", async ({ params, userId }) => {
        // Check permissions or ensure user can only access their own data
        // await this.roleService.hasPermission(
        //   userId,
        //   Resource.USER,
        //   Action.READ
        // );

        const user = await this.userService.findById(params.id);

        return ResponseFormatter.success({
          user: ResponseFormatter.formatUserResponse(user),
        });
      })
      .post(
        "/users",
        async ({ body, userId }) => {
          // Check permissions
          await this.roleService.hasPermission(
            userId,
            Resource.USER,
            Action.CREATE
          );

          const user = await this.userService.createUser(body);

          return ResponseFormatter.success(
            { user: ResponseFormatter.formatUserResponse(user) },
            "User created successfully"
          );
        },
        {
          body: "createUser",
        }
      )
      .patch(
        "/users/:id",
        async ({ params, body, userId }) => {
          // Check permissions or ensure user can only update their own data
          if (params.id !== userId) {
            await this.roleService.hasPermission(
              userId,
              Resource.USER,
              Action.UPDATE
            );
          }

          const updatedUser = await this.userService.updateUser(
            params.id,
            body
          );

          return ResponseFormatter.success(
            { user: ResponseFormatter.formatUserResponse(updatedUser) },
            "User updated successfully"
          );
        },
        {
          body: "updateUser",
        }
      )
      .delete("/users/:id", async ({ params, userId }) => {
        // Check permissions
        await this.roleService.hasPermission(
          userId,
          Resource.USER,
          Action.DELETE
        );

        await this.userService.deleteUser(params.id);

        return ResponseFormatter.success(null, "User deleted successfully");
      })
      .get("/users/online", async ({ userId }) => {
        // Check permissions
        await this.roleService.hasPermission(
          userId,
          Resource.USER,
          Action.READ
        );

        const onlineUsers = await this.userService.getOnlineUsers();

        return ResponseFormatter.success({
          onlineUsers: onlineUsers.map((user) =>
            ResponseFormatter.formatUserResponse(user)
          ),
          count: onlineUsers.length,
        });
      });
  }
}
