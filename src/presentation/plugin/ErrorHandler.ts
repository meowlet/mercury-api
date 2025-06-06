import { Elysia } from "elysia";
import { AppError, ErrorType } from "../../common/error/AppError";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";

function extractValidationDetails(error: any) {
  if (error.type !== "body" || !error.validator || !error.validator.schema) {
    return { message: "Invalid request data", issues: [] };
  }

  try {
    const schema = error.validator.schema;
    const schemaRef = schema.$ref;
    const providedValue = error.value || {};

    // Get schema definition from $defs
    const schemaDef = schema.$defs?.[schemaRef];

    if (!schemaDef) {
      return { message: "Invalid request format", issues: [] };
    }

    const requiredFields = schemaDef.required || [];
    const properties = schemaDef.properties || {};
    const providedFields = Object.keys(providedValue);
    const issues = [];

    // Check for missing required fields
    const missingFields = requiredFields.filter(
      (field: string) => !providedFields.includes(field)
    );

    missingFields.forEach((field: string) => {
      issues.push({
        field,
        issue: "required",
        message: `Field '${field}' is required`,
      });
    });

    // Check for validation errors in provided fields
    for (const [field, value] of Object.entries(providedValue)) {
      const fieldSchema = properties[field];
      if (!fieldSchema) continue;

      // Check string length constraints
      if (typeof value === "string" && fieldSchema.type === "string") {
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          issues.push({
            field,
            issue: "min_length",
            message:
              fieldSchema.error ||
              `Field '${field}' must be at least ${fieldSchema.minLength} characters long`,
          });
        }

        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          issues.push({
            field,
            issue: "max_length",
            message:
              fieldSchema.error ||
              `Field '${field}' must not exceed ${fieldSchema.maxLength} characters`,
          });
        }

        // Check pattern constraints
        if (fieldSchema.pattern) {
          const regex = new RegExp(fieldSchema.pattern);
          if (!regex.test(value)) {
            issues.push({
              field,
              issue: "pattern",
              message:
                fieldSchema.error || `Field '${field}' format is invalid`,
            });
          }
        }

        // Check email format
        if (fieldSchema.format === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            issues.push({
              field,
              issue: "format",
              message:
                fieldSchema.error ||
                `Field '${field}' must be a valid email address`,
            });
          }
        }
      }
    }

    if (issues.length > 0) {
      return {
        message: `One or more fields have invalid data`,
        issues,
      };
    }

    // If no specific issues found but validation still failed
    return {
      message: "One or more fields have invalid data",
      issues: [
        {
          field: "unknown",
          issue: "invalid_format",
          message: "Validation failed",
        },
      ],
    };
  } catch (err) {
    console.error("Error extracting validation details:", err);
    return { message: "Validation error", issues: [] };
  }
}

export function ErrorHandler(app: Elysia) {
  return app.error({ AppError }).onError(({ code, error, set }) => {
    console.error(`Error [${code}]:`, error);

    if (error instanceof AppError) {
      set.status = error.statusCode;
      return ResponseFormatter.error(error.message, error.type, error.details);
    }

    if (code == "PARSE") {
      set.status = 400;

      return ResponseFormatter.error(
        "Invalid JSON payload passed",
        ErrorType.PARSE_ERROR
      );
    }

    if (code === "NOT_FOUND") {
      set.status = 404;

      return ResponseFormatter.error(
        "The requested resource was not found",
        ErrorType.NOT_FOUND
      );
    }

    if (code === "VALIDATION") {
      set.status = 400;

      const validationDetails = extractValidationDetails(error);

      return ResponseFormatter.error(
        "Validation failed: " + validationDetails.message,
        ErrorType.VALIDATION_ERROR,
        {
          issues: validationDetails.issues,
          providedData: error.value,
        }
      );
    }

    console.error("Unhandled error:", error);
    set.status = 500;

    return ResponseFormatter.error(
      "An unexpected error occurred",
      ErrorType.INTERNAL_SERVER_ERROR
    );
  });
}
