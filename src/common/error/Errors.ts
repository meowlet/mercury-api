import { AppError, ErrorType } from "./AppError";

type ErrorFactory = {
  [K in ErrorType]: {
    throw(details?: Record<string, any>): never;

    withMessage(message: string, details?: Record<string, any>): never;
  };
};

const createErrorFactory = (): ErrorFactory => {
  const factory = {} as ErrorFactory;

  Object.values(ErrorType).forEach((type) => {
    factory[type as ErrorType] = {
      throw: (details = {}) => {
        throw AppError.create(type as ErrorType, details);
      },
      withMessage: (message, details = {}) => {
        throw AppError.withMessage(type as ErrorType, message, details);
      },
    };
  });

  return factory;
};

export const Errors = createErrorFactory();
