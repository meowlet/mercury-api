#!/usr/bin/env bun

// Test script for OTP-based password reset functionality
const OTP_BASE_URL = "https://api.meowsical.me/auth";

interface OtpTestUser {
  email: string;
  password: string;
}

const otpTestUser: OtpTestUser = {
  email: "test@example.com",
  password: "TestPassword123",
};

async function testOtpPasswordReset() {
  console.log("🧪 Testing OTP-based Password Reset Flow");
  console.log("=======================================");

  try {
    // Step 1: Request OTP
    console.log("\n1. 📧 Requesting OTP for password reset...");
    const otpResponse = await fetch(`${OTP_BASE_URL}/forgot-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: otpTestUser.email,
      }),
    });

    const otpResult = await otpResponse.json();
    console.log("OTP Request Response:", otpResult);

    if (!otpResult.success) {
      console.error("❌ Failed to request OTP:", otpResult.message);
      return;
    }

    console.log("✅ OTP request sent successfully");
    console.log("📨 Check your email for the 6-digit OTP code");

    // In a real test, you would get the OTP from email
    // For testing purposes, you might need to check the database or logs
    const testOtp = "123456"; // This would be the actual OTP from email

    console.log("\n2. 🔍 Testing OTP verification...");
    const verifyResponse = await fetch(`${OTP_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: otpTestUser.email,
        otp: testOtp,
      }),
    });

    const verifyResult = await verifyResponse.json();
    console.log("OTP Verification Response:", verifyResult);

    // Step 3: Reset password with OTP
    const newPassword = "NewTestPassword123";
    console.log("\n3. 🔐 Resetting password with OTP...");
    const resetResponse = await fetch(`${OTP_BASE_URL}/reset-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: otpTestUser.email,
        otp: testOtp,
        newPassword: newPassword,
      }),
    });

    const resetResult = await resetResponse.json();
    console.log("Password Reset Response:", resetResult);

    if (resetResult.success) {
      console.log("✅ Password reset successfully!");

      // Step 4: Test sign in with new password
      console.log("\n4. 🔑 Testing sign in with new password...");
      const signInResponse = await fetch(`${OTP_BASE_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: otpTestUser.email,
          password: newPassword,
        }),
      });

      const signInResult = await signInResponse.json();
      console.log("Sign In Response:", signInResult);

      if (signInResult.success) {
        console.log("✅ Sign in with new password successful!");
      } else {
        console.log("❌ Failed to sign in with new password");
      }
    } else {
      console.error("❌ Failed to reset password:", resetResult.message);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

async function testValidation() {
  console.log("\n🧪 Testing Input Validation");
  console.log("===========================");

  // Test invalid email
  console.log("\n1. Testing invalid email format...");
  try {
    const response = await fetch(`${OTP_BASE_URL}/forgot-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
      }),
    });

    const result = await response.json();
    console.log("Invalid email response:", result);
  } catch (error) {
    console.error("Error testing invalid email:", error);
  }

  // Test invalid OTP format
  console.log("\n2. Testing invalid OTP format...");
  try {
    const response = await fetch(`${OTP_BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: otpTestUser.email,
        otp: "12345", // Only 5 digits
      }),
    });

    const result = await response.json();
    console.log("Invalid OTP response:", result);
  } catch (error) {
    console.error("Error testing invalid OTP:", error);
  }

  // Test invalid password format
  console.log("\n3. Testing invalid password format...");
  try {
    const response = await fetch(`${OTP_BASE_URL}/reset-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: otpTestUser.email,
        otp: "123456",
        newPassword: "weak", // Too weak password
      }),
    });

    const result = await response.json();
    console.log("Invalid password response:", result);
  } catch (error) {
    console.error("Error testing invalid password:", error);
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Starting OTP Password Reset Tests");
  console.log("====================================");

  await testValidation();

  console.log("\n" + "=".repeat(50));
  console.log("⚠️  MANUAL STEP REQUIRED:");
  console.log("To test the full flow, you need to:");
  console.log("1. Ensure a test user exists with email:", otpTestUser.email);
  console.log("2. Check email for the actual OTP code");
  console.log("3. Update the testOtp variable in the script");
  console.log("4. Run the full test");
  console.log("=".repeat(50));

  // Uncomment to run full test (requires manual OTP input)
  // await testOtpPasswordReset();
}

// Execute tests
runTests().catch(console.error);
