import { Elysia, t } from "elysia";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { IFileUploadService } from "../../domain/service/IFileUploadService";
import { IUserService } from "../../domain/service/IUserService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { AppError, ErrorType } from "../../common/error/AppError";

const UploadModels = new Elysia().model({
  uploadFile: t.Object({
    file: t.File({
      maxSize: "5m",
      type: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/svg+xml",
      ],
    }),
  }),

  uploadAttachment: t.Object({
    file: t.File({
      maxSize: "10m",
    }),
  }),
});

export class UploadController {
  constructor(
    private fileUploadService: IFileUploadService,
    private userService: IUserService
  ) {}

  public routes() {
    return new Elysia()
      .use(UploadModels)

      .get(
        "/uploads/avatars/:filename",
        async ({ params, set }) => {
          const { filename } = params;

          try {
            // Construct the full path to the avatar file
            const avatarPath = `./uploads/avatars/${filename}`;
            const file = Bun.file(avatarPath);

            // Check if file exists
            if (!(await file.exists())) {
              set.status = 404;
              return { message: "Avatar file not found" };
            }

            // Set appropriate headers for PNG images
            set.headers = {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=31536000", // Cache for 1 year
            };

            return file;
          } catch (error) {
            console.error("Error serving avatar:", error);
            set.status = 500;
            return { message: "Error serving avatar" };
          }
        },
        {
          params: t.Object({
            filename: t.String(),
          }),
          detail: {
            tags: ["Upload"],
            summary: "Get avatar file",
            description: "Serve avatar file by filename",
          },
        }
      )
      .use(AuthMiddleware)
      .post(
        "/upload/avatar",
        async ({ body, userId }) => {
          const { file } = body;

          // Delete old avatar if exists
          await this.fileUploadService.deleteOldAvatar(userId);

          // Upload new avatar
          const avatarPath = await this.fileUploadService.uploadFile(
            file,
            userId,
            "avatar"
          );

          // Update user avatar in database
          const updatedUser = await this.userService.updateUser(userId, {
            avatar: avatarPath,
          });

          return ResponseFormatter.success({
            message: "Avatar uploaded successfully",
            user: {
              ...updatedUser,
              avatar: this.fileUploadService.getFileUrl(avatarPath),
            },
          });
        },
        {
          body: "uploadFile",
          detail: {
            tags: ["Upload"],
            summary: "Upload user avatar",
            description:
              "Upload and update user avatar image - processed to 1080p PNG with transparency preserved",
          },
        }
      )
      .post(
        "/upload/attachment",
        async ({ body, userId }) => {
          const { file } = body;

          // Upload attachment
          const attachmentPath = await this.fileUploadService.uploadFile(
            file,
            userId,
            "attachment"
          );

          return ResponseFormatter.success({
            message: "File uploaded successfully",
            file: {
              name: file.name,
              size: file.size,
              type: file.type,
              path: attachmentPath,
              url: this.fileUploadService.getFileUrl(attachmentPath),
            },
          });
        },
        {
          body: "uploadAttachment",
          detail: {
            tags: ["Upload"],
            summary: "Upload file attachment",
            description: "Upload file attachment for chat or other purposes",
          },
        }
      )

      .delete(
        "/upload/:filePath",
        async ({ params, userId }) => {
          const { filePath } = params;

          // Validate that user owns this file (basic check)
          if (!filePath.includes(userId)) {
            throw new AppError(ErrorType.FORBIDDEN, "Access denied");
          }

          // Delete file
          await this.fileUploadService.deleteFile(filePath);

          return ResponseFormatter.success({
            message: "File deleted successfully",
          });
        },
        {
          params: t.Object({
            filePath: t.String(),
          }),
          detail: {
            tags: ["Upload"],
            summary: "Delete uploaded file",
            description: "Delete uploaded file by path",
          },
        }
      );
  }
}
