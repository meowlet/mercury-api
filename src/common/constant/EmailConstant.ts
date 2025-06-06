export class EmailConstant {
  public static readonly SMTP_HOST = "smtp.gmail.com";
  public static readonly SMTP_PORT = 465;
  public static readonly SMTP_USER = Bun.env.SMTP_USER;
  public static readonly SMTP_PASS = Bun.env.SMTP_PASS;
}
