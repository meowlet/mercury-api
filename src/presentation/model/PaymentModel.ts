import { Elysia, t } from "elysia";
import {
  PaymentMethod,
  PaymentStatus,
  PremiumPlan,
} from "../../domain/entity/Payment";

export const PaymentModel = new Elysia().model({
  CreatePaymentBody: t.Object({
    amount: t.Number({ minimum: 0 }),
    currency: t.String({ default: "VND" }),
    plan: t.Enum(PremiumPlan),
    paymentMethod: t.Enum(PaymentMethod),
    paymentGateway: t.String(),
    metadata: t.Optional(t.Record(t.String(), t.Any())),
  }),

  ProcessPaymentBody: t.Object({
    transactionId: t.String(),
  }),
});
