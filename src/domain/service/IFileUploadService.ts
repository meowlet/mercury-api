export interface IFileUploadService {
  uploadFile(
    file: File,
    userId: string,
    type: "avatar" | "attachment"
  ): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  deleteOldAvatar(userId: string): Promise<void>;
  validateImage(file: File): boolean;
  validateFile(file: File): boolean;
  getFileUrl(filePath: string): string;
}
