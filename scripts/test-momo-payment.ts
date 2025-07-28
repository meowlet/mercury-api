import { PaymentMethod, PremiumPlan } from "../src/domain/entity/Payment";

// Test script để tạo payment với MoMo
async function testCreatePayment() {
  const paymentData = {
    userId: "507f1f77bcf86cd799439011", // Example MongoDB ObjectId
    amount: 99000, // 99,000 VND for monthly plan
    currency: "VND",
    plan: PremiumPlan.MONTHLY,
    paymentMethod: PaymentMethod.MOMO,
    paymentGateway: "momo",
    metadata: {
      description: "Monthly premium subscription",
      userAgent: "Mozilla/5.0...",
    },
  };

  try {
    const response = await fetch("http://localhost:3000/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your_jwt_token_here", // Replace with actual JWT
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Payment created successfully!");
      console.log("Payment ID:", result.data.payment._id);
      console.log("Payment URL:", result.data.payUrl);
      console.log("User can now pay using:", result.data.payUrl);
    } else {
      console.error("Payment creation failed:", result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example response structure:
/*
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "amount": 99000,
      "currency": "VND",
      "plan": "monthly",
      "status": "pending",
      "paymentMethod": "momo",
      "paymentGateway": "momo",
      "payUrl": "https://payment.momo.vn/gw_payment/otpgateway?partnerCode=MOMO&...",
      "premiumDuration": 30,
      "expiryDate": "2025-08-27T...",
      "createdAt": "2025-07-28T...",
      "updatedAt": "2025-07-28T..."
    },
    "payUrl": "https://payment.momo.vn/gw_payment/otpgateway?partnerCode=MOMO&..."
  }
}
*/

// Uncomment to run the test
// testCreatePayment();
