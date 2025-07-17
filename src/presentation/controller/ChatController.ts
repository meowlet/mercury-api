import { Elysia, t } from "elysia";
import { IChatService } from "../../domain/service/IChatService";
import { IFileUploadService } from "../../domain/service/IFileUploadService";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import {
  ConversationType,
  MessageType,
  MemberRole,
  AttachmentType,
} from "../../domain/entity/Chat";
import { ObjectId } from "mongodb";
import { ErrorType } from "../../common/error/AppError";

const ChatModels = new Elysia().model({
  createConversation: t.Object({
    participants: t.Array(t.String(), { minItems: 2, maxItems: 100 }),
    title: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    description: t.Optional(t.String({ maxLength: 500 })),
  }),

  updateConversation: t.Object({
    title: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    description: t.Optional(t.String({ maxLength: 500 })),
  }),

  sendMessage: t.Object({
    content: t.String({ maxLength: 5000 }),
    type: t.Enum(MessageType, { default: MessageType.TEXT }),
    replyTo: t.Optional(t.String()),
    attachments: t.Optional(
      t.Array(
        t.Object({
          name: t.String(),
          url: t.String(),
          size: t.Number(),
          mimeType: t.String(),
          type: t.Enum(AttachmentType),
        })
      )
    ),
  }),

  sendMessageWithFile: t.Object({
    content: t.Optional(t.String({ maxLength: 5000 })),
    type: t.Enum(MessageType, { default: MessageType.FILE }),
    replyTo: t.Optional(t.String()),
    file: t.File({
      maxSize: "10m",
    }),
  }),

  editMessage: t.Object({
    content: t.String({ minLength: 1, maxLength: 5000 }),
  }),

  addMember: t.Object({
    userId: t.String(),
  }),

  updateMemberRole: t.Object({
    userId: t.String(),
    role: t.Enum(MemberRole),
  }),

  paginationQuery: t.Object({
    page: t.Number({ default: 1, minimum: 1 }),
    limit: t.Number({ default: 20, minimum: 1, maximum: 100 }),
  }),

  searchQuery: t.Object({
    q: t.String({ minLength: 1 }),
    conversationId: t.Optional(t.String()),
  }),
});

export class ChatController {
  constructor(
    private chatService: IChatService,
    private fileUploadService?: IFileUploadService
  ) {}

  public routes() {
    return (
      new Elysia()
        .use(ChatModels)
        .use(AuthMiddleware)

        // Conversation routes
        .get(
          "/conversations",
          async ({ query, userId }) => {
            const { page, limit } = query;
            const result = await this.chatService.getUserConversations(
              userId,
              page,
              limit
            );

            return ResponseFormatter.success({
              conversations: result.conversations,
              pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
              },
            });
          },
          {
            query: "paginationQuery",
          }
        )

        .post(
          "/conversations",
          async ({ body, userId }) => {
            const conversation = await this.chatService.createConversation({
              ...body,
              createdBy: userId,
            });

            return ResponseFormatter.success(
              { conversation },
              "Conversation created successfully"
            );
          },
          {
            body: "createConversation",
          }
        )

        .get("/conversations/:id", async ({ params, userId }) => {
          const conversation = await this.chatService.getConversation(
            params.id,
            userId
          );

          return ResponseFormatter.success({ conversation });
        })

        .patch(
          "/conversations/:id",
          async ({ params, body, userId }) => {
            const conversation = await this.chatService.updateConversation(
              params.id,
              userId,
              body
            );

            return ResponseFormatter.success(
              { conversation },
              "Conversation updated successfully"
            );
          },
          {
            body: "updateConversation",
          }
        )

        .delete("/conversations/:id", async ({ params, userId }) => {
          await this.chatService.deleteConversation(params.id, userId);
          return ResponseFormatter.success(
            null,
            "Conversation deleted successfully"
          );
        })

        // Member management
        .post(
          "/conversations/:id/members",
          async ({ params, body, userId }) => {
            await this.chatService.addMember(params.id, userId, body.userId);
            return ResponseFormatter.success(null, "Member added successfully");
          },
          {
            body: "addMember",
          }
        )

        .delete(
          "/conversations/:id/members/:memberId",
          async ({ params, userId }) => {
            await this.chatService.removeMember(
              params.id,
              userId,
              params.memberId
            );
            return ResponseFormatter.success(
              null,
              "Member removed successfully"
            );
          }
        )

        .patch(
          "/conversations/:id/members/:memberId/role",
          async ({ params, body, userId }) => {
            await this.chatService.updateMemberRole(
              params.id,
              userId,
              params.memberId,
              body.role
            );
            return ResponseFormatter.success(
              null,
              "Member role updated successfully"
            );
          },
          {
            body: "updateMemberRole",
          }
        )

        .post("/conversations/:id/leave", async ({ params, userId }) => {
          await this.chatService.leaveConversation(params.id, userId);
          return ResponseFormatter.success(
            null,
            "Left conversation successfully"
          );
        })

        // Message routes
        .get(
          "/conversations/:id/messages",
          async ({ params, query, userId }) => {
            const { page, limit } = query;
            const result = await this.chatService.getMessages(
              params.id,
              userId,
              page,
              limit
            );

            return ResponseFormatter.success({
              messages: result.messages,
              pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
              },
            });
          },
          {
            query: "paginationQuery",
          }
        )

        .post(
          "/conversations/:id/messages",
          async ({ params, body, userId }) => {
            const message = await this.chatService.sendMessage({
              conversationId: params.id,
              senderId: userId,
              ...body,
            });

            return ResponseFormatter.success(
              { message },
              "Message sent successfully"
            );
          },
          {
            body: "sendMessage",
          }
        )

        .post(
          "/conversations/:id/messages/file",
          async ({ params, body, userId, set }) => {
            try {
              if (!this.fileUploadService) {
                set.status = 500;
                return ResponseFormatter.error(
                  "File upload service not available",
                  "SERVICE_UNAVAILABLE"
                );
              }

              const { file, content, type, replyTo } = body;

              // Upload file
              const filePath = await this.fileUploadService.uploadFile(
                file,
                userId,
                "attachment"
              );

              // Determine attachment type based on mime type
              let attachmentType = AttachmentType.DOCUMENT;
              if (file.type.startsWith("image/")) {
                attachmentType = AttachmentType.IMAGE;
              } else if (file.type.startsWith("video/")) {
                attachmentType = AttachmentType.VIDEO;
              } else if (file.type.startsWith("audio/")) {
                attachmentType = AttachmentType.AUDIO;
              }

              // Create attachment object
              const attachment = {
                _id: crypto.randomUUID(),
                name: file.name,
                type: attachmentType,
                url: this.fileUploadService.getFileUrl(filePath),
                size: file.size,
                mimeType: file.type,
              };

              // Send message with attachment
              const message = await this.chatService.sendMessage({
                conversationId: params.id,
                senderId: userId,
                content: content || `📎 ${file.name}`,
                type: type,
                replyTo,
                attachments: [attachment],
              });

              return ResponseFormatter.success(
                { message },
                "Message with file sent successfully"
              );
            } catch (error: any) {
              set.status = error.statusCode || 500;
              return ResponseFormatter.error(
                error.message,
                error.type || "FILE_MESSAGE_ERROR"
              );
            }
          },
          {
            body: "sendMessageWithFile",
          }
        )

        .get("/messages/:id", async ({ params, userId }) => {
          const message = await this.chatService.getMessage(params.id, userId);
          return ResponseFormatter.success({ message });
        })

        .patch(
          "/messages/:id",
          async ({ params, body, userId }) => {
            const message = await this.chatService.editMessage(
              params.id,
              userId,
              body.content
            );
            return ResponseFormatter.success(
              { message },
              "Message updated successfully"
            );
          },
          {
            body: "editMessage",
          }
        )

        .delete("/messages/:id", async ({ params, userId }) => {
          await this.chatService.deleteMessage(params.id, userId);
          return ResponseFormatter.success(
            null,
            "Message deleted successfully"
          );
        })

        .post("/messages/:id/read", async ({ params, userId }) => {
          await this.chatService.markAsRead(params.id, userId);
          return ResponseFormatter.success(null, "Message marked as read");
        })

        // Search and utility
        .get(
          "/messages/search",
          async ({ query, userId }) => {
            const messages = await this.chatService.searchMessages(
              query.q,
              userId,
              query.conversationId
            );
            return ResponseFormatter.success({ messages });
          },
          {
            query: "searchQuery",
          }
        )

        .get("/unread-count", async ({ userId }) => {
          const count = await this.chatService.getUnreadCount(userId);
          return ResponseFormatter.success({ unreadCount: count });
        })
    );
  }
}
