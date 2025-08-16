import crypto from "crypto";

export interface MoMoPaymentRequest {
  amount: number;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
}

export interface MoMoPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export class MoMoService {
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;

  constructor() {
    // Lấy từ environment variables hoặc config
    this.partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
    this.accessKey = process.env.MOMO_ACCESS_KEY || "";
    this.secretKey = process.env.MOMO_SECRET_KEY || "";
    this.endpoint =
      process.env.MOMO_ENDPOINT ||
      "https://test-payment.momo.vn/v2/gateway/api/create";
  }

  async createPayment(
    request: MoMoPaymentRequest
  ): Promise<MoMoPaymentResponse> {
    const requestId = this.generateRequestId();
    const orderInfo = request.orderInfo;
    const redirectUrl = request.redirectUrl;
    const ipnUrl = request.ipnUrl;
    const amount = request.amount.toString();
    const orderId = request.orderId;
    const requestType = "captureWallet";
    const extraData = request.extraData || "";

    // Tạo raw signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Tạo signature bằng HMAC SHA256
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: "vi",
      extraData: extraData,
      requestType: requestType,
      signature: signature,
    };

    console.log(requestBody);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      return result as MoMoPaymentResponse;
    } catch (error) {
      throw new Error(`MoMo API error: ${error}`);
    }
  }

  verifySignature(data: any): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = data;

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac("sha256", this.secretKey)
      .update(rawSignature)
      .digest("hex");

    return signature === expectedSignature;
  }

  private generateRequestId(): string {
    return Date.now().toString();
  }
}
