import { IEmailService } from "../../domain/service/IEmailService";
import { IEmailRepository } from "../../domain/repository/IEmailRepository";
import { ConfigConstant } from "../../common/constant/ConfigConstant";
import { EmailOptions } from "../../domain/entity/Email";

export class EmailService implements IEmailService {
  constructor(private emailRepository: IEmailRepository) {}

  async sendMail(options: EmailOptions): Promise<boolean> {
    return this.emailRepository.sendMail(options);
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${ConfigConstant.CLIENT_URL}/reset-password?token=${resetToken}`;

    return this.sendMail({
      to,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: "Welcome to Himmel!",
      html: `
        <h1>Welcome to Himmel!</h1>
        <p>Hello ${username},</p>
        <p>Thank you for joining Himmel! We're excited to have you as part of our community.</p>
        <p>Start exploring our platform and discover amazing fiction content!</p>
        <p>Best regards,</p>
        <p>The Himmel Team</p>
      `,
    });
  }
}
