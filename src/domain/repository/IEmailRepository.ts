import { EmailOptions } from "../entity/Email";

export interface IEmailRepository {
  sendMail(options: EmailOptions): Promise<boolean>;
}
