import nodemailer from "nodemailer";
import { IEmailRepository } from "../../domain/repository/IEmailRepository";
import { EmailConstant } from "../../common/constant/EmailConstant";
import { EmailOptions } from "../../domain/entity/Email";

export class EmailRepository implements IEmailRepository {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EmailConstant.SMTP_HOST,
      port: EmailConstant.SMTP_PORT,
      secure: EmailConstant.SMTP_PORT === 465,
      auth: {
        user: EmailConstant.SMTP_USER,
        pass: EmailConstant.SMTP_PASS,
      },
    });
  }

  async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Himmel" <${EmailConstant.SMTP_USER}>`,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
}
