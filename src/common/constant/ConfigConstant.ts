export class ConfigConstant {
  public static readonly CLIENT_URL = "http://localhost:3001";
  public static readonly SERVER_URL =
    Bun.env.SERVER_URL || "http://localhost:3000";
  public static readonly BUN_ENV = Bun.env.BUN_ENV || "development";
}
