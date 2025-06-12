import { Elysia, t } from "elysia";
import { IUserService } from "../../domain/service/IUserService";
import { IRoleService } from "../../domain/service/IRoleService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";

// Tách validation models riêng
const MeModels = new Elysia().model({});

export class MeController {
  constructor(
    private userService: IUserService,
    private roleService: IRoleService
  ) {}

  public routes() {
    return new Elysia()
      .use(MeModels) // Sử dụng MeModels thay vì UserModels
      .use(AuthMiddleware)
      .get("/me", async ({ userId }) => {
        const user = await this.userService.findById(userId);

        return ResponseFormatter.success({
          user: ResponseFormatter.formatUserResponse(user),
        });
      });
  }
}
