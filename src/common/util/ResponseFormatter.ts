import { create } from "domain";
import { ConfigConstant } from "../constant/ConfigConstant";

export class ResponseFormatter {
  static success<T>(data?: T, message?: string) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(
    message: string,
    errorType: string,
    details: Record<string, any> = {}
  ) {
    return {
      success: false,
      message,
      error: {
        type: errorType,
        details,
      },
    };
  }

  static formatUserResponse(user: any) {
    return {
      id: user._id,
      username: user.username,
      fullName: user.fullName ? user.fullName : "",
      email: user.email,
      isPremium: user.isPremium,
      avatar: user.avatar
        ? `${ConfigConstant.SERVER_URL}/users/${user._id}/avatar`
        : null,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen || null,
      createdAt: user.createdAt,
    };
  }
}
