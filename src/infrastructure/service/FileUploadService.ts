import { IFileUploadService } from "../../domain/service/IFileUploadService";
import { AppError, ErrorType } from "../../common/error/AppError";
import { join } from "path";
import { mkdir, writeFile, existsSync, unlinkSync } from "fs";
import { promisify } from "util";
import sharp from "sharp";

const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

export class FileUploadService implements IFileUploadService {
  private readonly uploadsDir = "./uploads";
  private readonly avatarsDir = "./uploads/avatars";
  private readonly attachmentsDir = "./uploads/attachments";
  private readonly allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
  ];
  private readonly allowedFileTypes = [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxImageSize = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist(): Promise<void> {
    try {
      if (!existsSync(this.uploadsDir)) {
        await mkdirAsync(this.uploadsDir, { recursive: true });
      }
      if (!existsSync(this.avatarsDir)) {
        await mkdirAsync(this.avatarsDir, { recursive: true });
      }
      if (!existsSync(this.attachmentsDir)) {
        await mkdirAsync(this.attachmentsDir, { recursive: true });
      }
    } catch (error) {
      console.error("Error creating upload directories:", error);
    }
  }

  async uploadFile(
    file: File,
    userId: string,
    type: "avatar" | "attachment"
  ): Promise<string> {
    // Validate file
    if (type === "avatar" && !this.validateImage(file)) {
      throw new AppError(ErrorType.INVALID_FILE_TYPE);
    }

    if (type === "attachment" && !this.validateFile(file)) {
      throw new AppError(ErrorType.INVALID_FILE_TYPE);
    }

    console.log(`Uploading ${type} for user ${userId}:`, file.name);

    // Check file size
    const maxSize = type === "avatar" ? this.maxImageSize : this.maxFileSize;
    if (file.size > maxSize) {
      throw new AppError(ErrorType.FILE_TOO_LARGE);
    }

    // Generate unique filename
    const filename =
      type === "avatar"
        ? `${userId}.png`
        : `${userId}_${Date.now()}_${file.name}`;

    // Determine directory
    const dir = type === "avatar" ? this.avatarsDir : this.attachmentsDir;
    const filePath = join(dir, filename);

    try {
      // Convert File to ArrayBuffer then to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (type === "avatar") {
        // Process avatar image to 1080p PNG with transparency
        const processedBuffer = await sharp(buffer)
          .resize(1080, 1080, {
            fit: "inside",
            withoutEnlargement: true,
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
          })
          .png({
            compressionLevel: 1, // Minimal compression to preserve quality
            progressive: true,
            palette: false, // Keep full color range
            quality: 100, // Maximum quality
          })
          .toBuffer();

        // Write processed file
        await writeFileAsync(filePath, processedBuffer);
      } else {
        // Write file as-is for attachments
        await writeFileAsync(filePath, buffer);
      }

      // Return relative path for storage in database
      return `uploads/${type}s/${filename}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new AppError(ErrorType.FILE_UPLOAD_FAILED);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = join(".", filePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      // Don't throw error for file deletion failures
    }
  }

  async deleteOldAvatar(userId: string): Promise<void> {
    try {
      const avatarPath = join(this.avatarsDir, `${userId}.png`);
      if (existsSync(avatarPath)) {
        unlinkSync(avatarPath);
      }
    } catch (error) {
      console.error("Error deleting old avatar:", error);
      // Don't throw error for file deletion failures
    }
  }

  validateImage(file: File): boolean {
    return (
      this.allowedImageTypes.includes(file.type) &&
      file.size <= this.maxImageSize
    );
  }

  validateFile(file: File): boolean {
    return (
      this.allowedFileTypes.includes(file.type) && file.size <= this.maxFileSize
    );
  }

  getFileUrl(filePath: string): string {
    // Return URL for serving the file (you might want to add domain here)
    return `/${filePath}`;
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot > 0 ? filename.substring(lastDot) : "";
  }
}
