import { Db, ObjectId } from "mongodb";
import { IPaymentRepository } from "../../domain/repository/IPaymentRepository";
import { Payment, PaymentStatus } from "../../domain/entity/Payment";
import { DatabaseConstant } from "../../common/constant/DatabaseConstant";

export class PaymentRepository implements IPaymentRepository {
  constructor(private db: Db) {}

  async create(payment: Payment): Promise<Payment> {
    const result = await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .insertOne(payment);

    return {
      ...payment,
      _id: result.insertedId,
    };
  }

  async findById(id: string): Promise<Payment | null> {
    return await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .findOne({ transactionId });
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    updates.updatedAt = new Date();

    await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Payment not found after update");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .find({ status })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await this.db
      .collection<Payment>(DatabaseConstant.PAYMENT_COLLECTION)
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();
  }
}
