import { MoMoService } from "../../infrastructure/service/MoMoService";
import { PaymentService } from "../../infrastructure/service/PaymentService";
import { PaymentStatus } from "../../domain/entity/Payment";
import { ErrorType, throwError } from "../../common/error/AppError";

export class MoMoWebhookController {
  constructor(
    private momoService: MoMoService,
    private paymentService: PaymentService
  ) {}

  async handleWebhook(body: any) {
    try {
      // Verify signature
      if (!this.momoService.verifySignature(body)) {
        throwError(ErrorType.UNAUTHORIZED, {
          message: "Invalid MoMo signature",
        });
      }

      const { orderId, resultCode, transId, amount, message, extraData } = body;

      // Get payment by orderId
      const payment = await this.paymentService.getPaymentById(orderId);
      if (!payment) {
        throwError(ErrorType.NOT_FOUND, {
          message: "Payment not found",
        });
      }

      // Process payment based on result code
      if (resultCode === 0) {
        // Payment successful
        await this.paymentService.processPayment(orderId, transId);
        await this.paymentService.confirmPayment(orderId);

        return {
          success: true,
          message: "Payment processed successfully",
        };
      } else {
        // Payment failed
        await this.paymentService.updatePaymentStatus(
          orderId,
          PaymentStatus.FAILED
        );

        return {
          success: false,
          message: `Payment failed: ${message}`,
        };
      }
    } catch (error) {
      console.error("MoMo webhook error:", error);
      throw error;
    }
  }
}
