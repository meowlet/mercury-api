// Test script for Payment API
// Run this with: bun run test-payment.ts

const BASE_URL = "http://localhost:3000";
let accessToken = "";

// Test data
const testUser = {
  username: "testuser",
  email: "test@example.com",
  password: "TestPass123",
};

const testPayment = {
  amount: 99000,
  currency: "VND",
  plan: "monthly",
  paymentMethod: "momo",
  paymentGateway: "momo",
  metadata: {
    source: "test",
    userId: "test123",
  },
};

async function signUp() {
  console.log("1. Creating test user...");
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    if (response.ok) {
      console.log("✅ User created successfully");
    } else {
      console.log("ℹ️ User might already exist");
    }
  } catch (error) {
    console.error("❌ Error creating user:", error);
  }
}

async function signIn() {
  console.log("2. Signing in...");
  try {
    const response = await fetch(`${BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: testUser.email,
        password: testUser.password,
      }),
    });

    const result = await response.json();
    if (result.success) {
      accessToken = result.data.accessToken;
      console.log("✅ Signed in successfully");
    } else {
      console.error("❌ Sign in failed:", result);
    }
  } catch (error) {
    console.error("❌ Error signing in:", error);
  }
}

async function createPayment() {
  console.log("3. Creating payment...");
  try {
    const response = await fetch(`${BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(testPayment),
    });

    const result = await response.json();
    if (result.success) {
      console.log("✅ Payment created:", result.data.payment._id);
      return result.data.payment._id;
    } else {
      console.error("❌ Payment creation failed:", result);
    }
  } catch (error) {
    console.error("❌ Error creating payment:", error);
  }
  return null;
}

async function confirmPayment(paymentId: string) {
  console.log("4. Confirming payment...");
  try {
    const response = await fetch(`${BASE_URL}/payments/${paymentId}/confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    if (result.success) {
      console.log("✅ Payment confirmed successfully");
    } else {
      console.error("❌ Payment confirmation failed:", result);
    }
  } catch (error) {
    console.error("❌ Error confirming payment:", error);
  }
}

async function getMyPayments() {
  console.log("5. Getting user payments...");
  try {
    const response = await fetch(`${BASE_URL}/payments/my`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    if (result.success) {
      console.log(
        "✅ User payments:",
        result.data.payments.length,
        "payments found"
      );
      result.data.payments.forEach((payment: any) => {
        console.log(
          `  - ${payment._id}: ${payment.amount} ${payment.currency} (${payment.status})`
        );
      });
    } else {
      console.error("❌ Failed to get payments:", result);
    }
  } catch (error) {
    console.error("❌ Error getting payments:", error);
  }
}

async function checkUserProfile() {
  console.log("6. Checking user premium status...");
  try {
    const response = await fetch(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    if (result.success) {
      const user = result.data.user;
      console.log(
        `✅ User premium status: ${user.isPremium ? "Premium" : "Free"}`
      );
      if (user.premiumExpiryDate) {
        console.log(`   Expires: ${user.premiumExpiryDate}`);
      }
    } else {
      console.error("❌ Failed to get user profile:", result);
    }
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
  }
}

async function runTest() {
  console.log("🚀 Starting Payment API Test\n");

  await signUp();
  await signIn();

  if (!accessToken) {
    console.error("❌ Cannot proceed without access token");
    return;
  }

  const paymentId = await createPayment();
  if (paymentId) {
    await confirmPayment(paymentId);
  }

  await getMyPayments();
  await checkUserProfile();

  console.log("\n✨ Test completed!");
}

// Run the test
runTest().catch(console.error);
