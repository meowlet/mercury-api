import { Elysia, t } from "elysia";
import { IPaymentService } from "../../domain/service/IPaymentService";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import {
  PaymentMethod,
  PaymentStatus,
  PremiumPlan,
} from "../../domain/entity/Payment";
import { PaymentModel } from "../model/PaymentModel";

export class PaymentController {
  constructor(private paymentService: IPaymentService) {}

  public routes() {
    return new Elysia()
      .use(PaymentModel)
      .use(AuthMiddleware)
      .post(
        "/payments",
        async ({ body, userId }) => {
          const result = await this.paymentService.createPayment({
            ...body,
            userId,
          });

          return ResponseFormatter.success(
            result,
            "Payment created successfully"
          );
        },
        {
          body: "CreatePaymentBody",
          detail: {
            tags: ["Payment"],
            summary: "Create payment",
            description: "Create a new payment for premium subscription",
          },
        }
      )

      .post(
        "/payments/:id/process",
        async ({ params, body }) => {
          const payment = await this.paymentService.processPayment(
            params.id,
            (body as any).transactionId
          );

          return ResponseFormatter.success(
            { payment },
            "Payment processed successfully"
          );
        },
        {
          body: "ProcessPaymentBody",
          detail: {
            tags: ["Payment"],
            summary: "Process payment",
            description: "Process payment with transaction ID",
          },
        }
      )

      .post(
        "/payments/:id/confirm",
        async ({ params }) => {
          const payment = await this.paymentService.confirmPayment(params.id);

          return ResponseFormatter.success(
            { payment },
            "Payment confirmed successfully"
          );
        },
        {
          detail: {
            tags: ["Payment"],
            summary: "Confirm payment",
            description: "Confirm payment and upgrade user to premium",
          },
        }
      )

      .post(
        "/payments/:id/cancel",
        async ({ params }) => {
          const payment = await this.paymentService.cancelPayment(params.id);

          return ResponseFormatter.success(
            { payment },
            "Payment cancelled successfully"
          );
        },
        {
          detail: {
            tags: ["Payment"],
            summary: "Cancel payment",
            description: "Cancel a pending payment",
          },
        }
      )

      .post(
        "/payments/:id/refund",
        async ({ params }) => {
          const payment = await this.paymentService.refundPayment(params.id);

          return ResponseFormatter.success(
            { payment },
            "Payment refunded successfully"
          );
        },
        {
          detail: {
            tags: ["Payment"],
            summary: "Refund payment",
            description: "Refund a completed payment",
          },
        }
      )

      .get(
        "/payments/:id",
        async ({ params, set }) => {
          const payment = await this.paymentService.getPaymentById(params.id);

          if (!payment) {
            set.status = 404;
            return ResponseFormatter.success(null, "Payment not found");
          }

          return ResponseFormatter.success({ payment });
        },
        {
          detail: {
            tags: ["Payment"],
            summary: "Get payment by ID",
            description: "Retrieve a specific payment by ID",
          },
        }
      )

      .get(
        "/payments/my",
        async ({ userId }) => {
          const payments = await this.paymentService.getUserPayments(userId);

          return ResponseFormatter.success({
            payments,
            count: payments.length,
          });
        },
        {
          detail: {
            tags: ["Payment"],
            summary: "Get user payments",
            description: "Get all payments for the authenticated user",
          },
        }
      );
  }
}
