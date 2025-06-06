import { Elysia, t } from "elysia";
import { DIToken } from "../../common/enum/DIToken";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { AuthMiddleware } from "../../common/middleware/AuthMiddleware";
import { Action, Resource } from "../../domain/entity/User";
import { UserService } from "../../infrastructure/service/UserService";
import { IUserService } from "../../domain/service/IUserService";

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
  }),

  paginationQuery: t.Object({
    page: t.Optional(t.Numeric()),
    limit: t.Optional(t.Numeric()),
  }),
});

export class UserController {
  constructor(private userService: IUserService) {}

  public routes() {
    return (
      new Elysia()
        .use(UserModels)
        // .use(AuthMiddleware)
        .get(
          "/users",
          async ({ query }) => {
            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 10;

            const { users, total } = await this.userService.findAll(
              page,
              limit
            );

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
        .get("/users/:id", async ({ params }) => {
          const user = await this.userService.findById(params.id);

          return ResponseFormatter.success({
            user: ResponseFormatter.formatUserResponse(user),
          });
        })
        .post(
          "/users",
          async ({ body }) => {
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
        .put(
          "/users/:id",
          async ({ params, body }) => {
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
        .delete("/users/:id", async ({ params }) => {
          await this.userService.deleteUser(params.id);

          return ResponseFormatter.success(null, "User deleted successfully");
        })
    );
  }
}
