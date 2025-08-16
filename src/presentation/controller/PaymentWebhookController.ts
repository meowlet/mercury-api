import { Elysia } from "elysia";
import { IPaymentService } from "../../domain/service/IPaymentService";
import { container } from "../../injection/Container";
import { DIToken } from "../../common/enum/DIToken";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { MoMoService } from "../../infrastructure/service/MoMoService";
import { PaymentStatus } from "../../domain/entity/Payment";

// Webhook endpoint for payment gateways to notify payment status
export const PaymentWebhookController = new Elysia()
  .post("/webhooks/payment/momo", async ({ body, set }) => {
    try {
      const paymentService = container.resolve<IPaymentService>(
        DIToken.PAYMENT_SERVICE
      );
      const momoService = new MoMoService();

      const webhookData = body as any;

      // Verify MoMo webhook signature
      const isValidSignature = momoService.verifySignature(webhookData);
      if (!isValidSignature) {
        set.status = 401;
        return ResponseFormatter.error(
          "Invalid MoMo signature",
          "UNAUTHORIZED"
        );
      }

      if (webhookData.resultCode === 0) {
        // Payment successful
        await paymentService.processPayment(
          webhookData.orderId,
          webhookData.transId
        );

        // Confirm the payment to upgrade user
        await paymentService.confirmPayment(webhookData.orderId);
      } else {
        // Payment failed
        await paymentService.updatePaymentStatus(
          webhookData.orderId,
          PaymentStatus.FAILED
        );
      }

      return ResponseFormatter.success(null, "Webhook processed successfully");
    } catch (error) {
      console.error("MoMo payment webhook error:", error);
      set.status = 500;
      return ResponseFormatter.error(
        "Webhook processing failed",
        "INTERNAL_SERVER_ERROR"
      );
    }
  })

  .post("/webhooks/payment/vnpay", async ({ body, set }) => {
    try {
      const paymentService = container.resolve<IPaymentService>(
        DIToken.PAYMENT_SERVICE
      );

      const webhookData = body as any;

      if (webhookData.vnp_ResponseCode === "00") {
        // Payment successful
        await paymentService.processPayment(
          webhookData.vnp_TxnRef,
          webhookData.vnp_TransactionNo
        );

        await paymentService.confirmPayment(webhookData.vnp_TxnRef);
      } else {
        // Payment failed
        await paymentService.cancelPayment(webhookData.vnp_TxnRef);
      }

      return ResponseFormatter.success(null, "Webhook processed successfully");
    } catch (error) {
      console.error("VNPay webhook error:", error);
      set.status = 500;
      return { error: "Webhook processing failed" };
    }
  })

  .post("/webhooks/payment/paypal", async ({ body, set }) => {
    try {
      const paymentService = container.resolve<IPaymentService>(
        DIToken.PAYMENT_SERVICE
      );

      const webhookData = body as any;

      if (webhookData.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const paymentId = webhookData.resource.custom_id;
        const transactionId = webhookData.resource.id;

        await paymentService.processPayment(paymentId, transactionId);
        await paymentService.confirmPayment(paymentId);
      } else if (webhookData.event_type === "PAYMENT.CAPTURE.DENIED") {
        const paymentId = webhookData.resource.custom_id;
        await paymentService.cancelPayment(paymentId);
      }

      return ResponseFormatter.success(null, "Webhook processed successfully");
    } catch (error) {
      console.error("PayPal webhook error:", error);
      set.status = 500;
      return { error: "Webhook processing failed" };
    }
  });
