import { Payment, CreatePaymentData, PaymentStatus } from "../entity/Payment";

export interface CreatePaymentResponse {
  payment: Payment;
  payUrl?: string;
}

export interface IPaymentService {
  createPayment(data: CreatePaymentData): Promise<CreatePaymentResponse>;
  processPayment(paymentId: string, transactionId: string): Promise<Payment>;
  confirmPayment(paymentId: string): Promise<Payment>;
  cancelPayment(paymentId: string): Promise<Payment>;
  refundPayment(paymentId: string): Promise<Payment>;
  updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<Payment>;
  getPaymentById(id: string): Promise<Payment | null>;
  getUserPayments(userId: string): Promise<Payment[]>;
  upgradeUserToPremium(userId: string, plan: string): Promise<void>;
}
