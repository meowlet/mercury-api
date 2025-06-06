import { EmailOptions } from "../entity/Email";

export interface IEmailService {
  sendMail(options: EmailOptions): Promise<boolean>;
  sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean>;
  sendWelcomeEmail(to: string, username: string): Promise<boolean>;
}
