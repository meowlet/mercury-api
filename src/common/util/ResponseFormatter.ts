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
      email: user.email,
      isPremium: user.isPremium,
    };
  }
}
