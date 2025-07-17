# File Upload Features

## Overview

Hệ thống Mercury API đã được cập nhật để hỗ trợ upload file với các tính năng sau:

1. **Avatar cho User**: Người dùng có thể upload và cập nhật avatar
2. **Attachments trong Chat**: Có thể gửi file đính kèm trong tin nhắn chat

## API Endpoints

### Upload Avatar

```
POST /upload/avatar
Content-Type: multipart/form-data

Body:
- file: Image file (JPEG, PNG, GIF, WebP, max 5MB)

Response:
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "user": {
      ...userInfo,
      "avatar": "/uploads/avatars/userId_timestamp.jpg"
    }
  }
}
```

### Upload File Attachment

```
POST /upload/attachment
Content-Type: multipart/form-data

Body:
- file: Any supported file type (max 10MB)

Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "name": "document.pdf",
      "size": 1024,
      "type": "application/pdf",
      "path": "uploads/attachments/userId_timestamp.pdf",
      "url": "/uploads/attachments/userId_timestamp.pdf"
    }
  }
}
```

### Send Message with File

```
POST /conversations/:id/messages/file
Content-Type: multipart/form-data

Body:
- file: File to attach
- content: Optional message content
- type: MessageType (default: FILE)
- replyTo: Optional message ID to reply to

Response:
{
  "success": true,
  "message": "Message with file sent successfully",
  "data": {
    "message": {
      ...messageInfo,
      "attachments": [
        {
          "_id": "attachment-uuid",
          "name": "document.pdf",
          "type": "DOCUMENT",
          "url": "/uploads/attachments/userId_timestamp.pdf",
          "size": 1024,
          "mimeType": "application/pdf"
        }
      ]
    }
  }
}
```

### Send Message with Pre-uploaded Attachments

```
POST /conversations/:id/messages
Content-Type: application/json

Body:
{
  "content": "Here's the document you requested",
  "type": "TEXT",
  "attachments": [
    {
      "_id": "attachment-uuid",
      "name": "document.pdf",
      "type": "DOCUMENT",
      "url": "/uploads/attachments/userId_timestamp.pdf",
      "size": 1024,
      "mimeType": "application/pdf"
    }
  ]
}
```

### Delete File

```
DELETE /upload/:filePath

Response:
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Supported File Types

### Avatar (Images only)

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- Max size: 5MB

### Attachments

- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Text files: TXT
- Max size: 10MB

## File Storage

- Files được lưu trữ trong thư mục `uploads/`
- Avatar: `uploads/avatars/`
- Attachments: `uploads/attachments/`
- File naming format: `{userId}_{timestamp}.{extension}`
- Files được serve thông qua static middleware tại path `/uploads/*`

## Security Features

- File type validation
- File size limits
- User authentication required
- Basic ownership validation (files contain userId in path)
- Automatic directory creation

## Usage Examples

### Frontend Upload Avatar

```javascript
const formData = new FormData();
formData.append("file", avatarFile);

const response = await fetch("/upload/avatar", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### Frontend Send File in Chat

```javascript
const formData = new FormData();
formData.append("file", attachmentFile);
formData.append("content", "Optional message text");

const response = await fetch(`/conversations/${conversationId}/messages/file`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

## Database Schema Updates

### User Entity

```typescript
export interface User {
  // ... existing fields
  avatar?: string; // URL hoặc path đến avatar
}
```

### Message Entity (đã có sẵn)

```typescript
export interface Message {
  // ... existing fields
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  _id: string;
  name: string;
  type: AttachmentType;
  url: string;
  size: number;
  mimeType: string;
}
```

## Error Handling

- `INVALID_FILE_TYPE`: File type không được hỗ trợ
- `FILE_TOO_LARGE`: File vượt quá kích thước cho phép
- `FILE_UPLOAD_FAILED`: Lỗi trong quá trình upload
- `FORBIDDEN`: Không có quyền truy cập file
