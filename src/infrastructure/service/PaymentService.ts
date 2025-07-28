import {
  IPaymentService,
  CreatePaymentResponse,
} from "../../domain/service/IPaymentService";
import { IPaymentRepository } from "../../domain/repository/IPaymentRepository";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import {
  Payment,
  CreatePaymentData,
  PaymentStatus,
  PremiumPlan,
  PaymentMethod,
} from "../../domain/entity/Payment";
import { ErrorType, throwError } from "../../common/error/AppError";
import { ObjectId } from "mongodb";
import { MoMoService } from "./MoMoService";

export class PaymentService implements IPaymentService {
  private momoService: MoMoService;

  constructor(
    private paymentRepository: IPaymentRepository,
    private userRepository: IUserRepository
  ) {
    this.momoService = new MoMoService();
  }

  async createPayment(data: CreatePaymentData): Promise<CreatePaymentResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throwError(ErrorType.USER_NOT_FOUND);
    }

    // Calculate premium duration based on plan
    const premiumDuration = this.getPremiumDuration(data.plan);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + premiumDuration);

    const payment: Payment = {
      userId: new ObjectId(data.userId),
      amount: data.amount,
      currency: data.currency,
      plan: data.plan,
      status: PaymentStatus.PENDING,
      paymentMethod: data.paymentMethod,
      paymentGateway: data.paymentGateway,
      metadata: data.metadata,
      premiumDuration,
      expiryDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create payment record first
    const createdPayment = await this.paymentRepository.create(payment);

    let payUrl: string | undefined;

    // If payment method is MoMo, create payment URL
    if (data.paymentMethod === PaymentMethod.MOMO) {
      try {
        const momoResponse = await this.momoService.createPayment({
          amount: data.amount,
          orderId: createdPayment._id!.toString(),
          orderInfo: `Payment for ${data.plan} premium plan`,
          redirectUrl:
            process.env.PAYMENT_REDIRECT_URL ||
            "http://localhost:3000/payment/success",
          ipnUrl:
            process.env.PAYMENT_IPN_URL ||
            "http://localhost:3000/payment/webhook",
          extraData: JSON.stringify({ userId: data.userId, plan: data.plan }),
        });
        console.log(momoResponse);
        if (momoResponse.resultCode === 0 && momoResponse.payUrl) {
          payUrl = momoResponse.payUrl;

          // Update payment with payUrl
          await this.paymentRepository.update(createdPayment._id!.toString(), {
            payUrl: payUrl,
          });

          createdPayment.payUrl = payUrl;
        } else {
          // If MoMo payment creation failed, mark payment as failed
          await this.paymentRepository.update(createdPayment._id!.toString(), {
            status: PaymentStatus.FAILED,
          });

          throwError(ErrorType.PAYMENT_GATEWAY_ERROR, {
            message: `MoMo payment creation failed: ${momoResponse.message}`,
          });
        }
      } catch (error) {
        // Update payment status to failed
        await this.paymentRepository.update(createdPayment._id!.toString(), {
          status: PaymentStatus.FAILED,
        });

        throw error;
      }
    }

    return {
      payment: createdPayment,
      payUrl: payUrl,
    };
  }

  async processPayment(
    paymentId: string,
    transactionId: string
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throwError(ErrorType.NOT_FOUND, { message: "Payment not found" });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Payment is not pending",
      });
    }

    // Update payment with transaction ID (processing status would be handled by payment gateway webhook)
    return await this.paymentRepository.update(paymentId, {
      transactionId: transactionId,
      status: PaymentStatus.COMPLETED, // In real scenario, this would be updated by webhook
    });
  }

  async confirmPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throwError(ErrorType.NOT_FOUND, { message: "Payment not found" });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Payment is not pending",
      });
    }

    // Update payment status
    const updatedPayment = await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.COMPLETED,
    });

    // Upgrade user to premium
    await this.upgradeUserToPremium(payment.userId.toString(), payment.plan);

    return updatedPayment;
  }

  async cancelPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throwError(ErrorType.NOT_FOUND, { message: "Payment not found" });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Payment is not pending",
      });
    }

    return await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.CANCELLED,
    });
  }

  async refundPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throwError(ErrorType.NOT_FOUND, { message: "Payment not found" });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Payment is not completed",
      });
    }

    // In real scenario, you would process refund with payment gateway here

    const updatedPayment = await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
    });

    // Remove premium from user
    await this.userRepository.update(payment.userId.toString(), {
      isPremium: false,
      premiumExpiryDate: undefined,
    });

    return updatedPayment;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throwError(ErrorType.NOT_FOUND, { message: "Payment not found" });
    }

    return await this.paymentRepository.update(paymentId, {
      status: status,
      updatedAt: new Date(),
    });
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    return await this.paymentRepository.findById(id);
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await this.paymentRepository.findByUserId(userId);
  }

  async upgradeUserToPremium(userId: string, plan: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwError(ErrorType.USER_NOT_FOUND);
    }

    const premiumDuration = this.getPremiumDuration(plan as PremiumPlan);
    const expiryDate = new Date();

    // If user already has premium, extend from current expiry date
    if (
      user.isPremium &&
      user.premiumExpiryDate &&
      user.premiumExpiryDate > new Date()
    ) {
      expiryDate.setTime(user.premiumExpiryDate.getTime());
    }

    expiryDate.setDate(expiryDate.getDate() + premiumDuration);

    await this.userRepository.update(userId, {
      isPremium: true,
      premiumExpiryDate: expiryDate,
    });
  }

  private getPremiumDuration(plan: PremiumPlan): number {
    switch (plan) {
      case PremiumPlan.MONTHLY:
        return 30;
      case PremiumPlan.QUARTERLY:
        return 90;
      case PremiumPlan.YEARLY:
        return 365;
      default:
        return 30;
    }
  }
}
