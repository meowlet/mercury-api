import { ObjectId } from "mongodb";
import { User } from "./User";

export interface Payment {
  _id?: ObjectId | string;
  userId: ObjectId | User | string;
  amount: number;
  currency: string;
  plan: PremiumPlan;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentGateway: string;
  payUrl?: string; // URL để user thanh toán
  metadata?: Record<string, any>;
  premiumDuration: number; // in days
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PAYPAL = "paypal",
  BANK_TRANSFER = "bank_transfer",
  MOMO = "momo",
  VNPAY = "vnpay",
}

export enum PremiumPlan {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
}

export interface CreatePaymentData {
  userId: string;
  amount: number;
  currency: string;
  plan: PremiumPlan;
  paymentMethod: PaymentMethod;
  paymentGateway: string;
  metadata?: Record<string, any>;
}
