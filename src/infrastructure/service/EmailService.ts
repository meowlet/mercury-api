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

  async sendPasswordResetOtp(to: string, otp: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: "Password Reset OTP - Himmel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Password Reset OTP</h1>
          <p style="color: #555; font-size: 16px;">You requested a password reset. Use the OTP code below to reset your password:</p>
          
          <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <h2 style="color: #007bff; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</h2>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center;">
            <strong>This OTP will expire in 10 minutes.</strong><br>
            If you didn't request this, please ignore this email.
          </p>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px;">© Himmel - Secure Password Reset</p>
          </div>
        </div>
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
