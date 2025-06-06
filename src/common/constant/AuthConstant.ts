export class AuthConstant {
  public static readonly PASSWORD_MIN_LENGTH = 4;
  public static readonly PASSWORD_MAX_LENGTH = 64;
  public static readonly USERNAME_MIN_LENGTH = 4;
  public static readonly USERNAME_MAX_LENGTH = 32;
  public static readonly EMAIL_MIN_LENGTH = 5;
  public static readonly EMAIL_MAX_LENGTH = 256;
  public static readonly USERNAME_PATTERN = "^[a-z0-9_]+$";
  public static readonly PASSWORD_PATTERN =
    "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).+$";

  public static readonly JWT_SECRET = Bun.env.JWT_SECRET || "MEOW";
  public static readonly ACCESS_TOKEN_EXPIRES_IN = 3600;
  public static readonly REFRESH_TOKEN_EXPIRES_IN = 3600 * 24 * 7;
  public static readonly BCRYPT_SALT_ROUNDS = 10;
  public static readonly GOOGLE_CLIENT_ID = Bun.env.GOOGLE_CLIENT_ID || "";
  public static readonly GOOGLE_CLIENT_SECRET =
    Bun.env.GOOGLE_CLIENT_SECRET || "";
}
