import { Payment, CreatePaymentData, PaymentStatus } from "../entity/Payment";

export interface IPaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByUserId(userId: string): Promise<Payment[]>;
  findByTransactionId(transactionId: string): Promise<Payment | null>;
  update(id: string, updates: Partial<Payment>): Promise<Payment>;
  delete(id: string): Promise<void>;
  findByStatus(status: PaymentStatus): Promise<Payment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]>;
}
