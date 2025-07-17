import { Elysia, t } from "elysia";
import { IChatService } from "../../domain/service/IChatService";
import { IUserService } from "../../domain/service/IUserService";
import { Message } from "../../domain/entity/Chat";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import jwt from "jsonwebtoken";
import { AuthConstant } from "../../common/constant/AuthConstant";

interface WebSocketData {
  userId: string;
  conversationId?: string;
}

interface ChatEvent {
  type: "message" | "typing" | "read" | "user_joined" | "user_left";
  conversationId: string;
  data: any;
  timestamp: Date;
}

export class ChatWebSocket {
  private connections = new Map<string, Set<any>>(); // userId -> Set of WebSocket connections
  private conversationUsers = new Map<string, Set<string>>(); // conversationId -> Set of userIds

  constructor(
    private chatService: IChatService,
    private userService: IUserService
  ) {}

  public routes() {
    return new Elysia().use(AuthMiddleware).ws("/chat/ws", {
      body: t.Object({
        type: t.String(),
        conversationId: t.Optional(t.String()),
        data: t.Any(),
      }),

      open: async (ws) => {
        const { userId } = ws.data;

        // Clean up any dead connections first
        this.cleanupDeadConnections(userId);

        // Add to connections map
        if (!this.connections.has(userId)) {
          this.connections.set(userId, new Set());
        }
        this.connections.get(userId)!.add(ws);

        // Set user online
        await this.userService.setUserOnline(userId);

        console.log(
          `User ${userId} connected to chat WebSocket. Total connections: ${
            this.connections.get(userId)?.size || 0
          }`
        );
      },

      message: async (ws, message) => {
        const { type, conversationId, data } = message;
        const { userId } = ws.data as WebSocketData;

        console.log(message);

        try {
          switch (type) {
            case "join_conversation":
              await this.handleJoinConversation(ws, conversationId!, userId);
              break;

            case "leave_conversation":
              await this.handleLeaveConversation(ws, conversationId!, userId);
              break;

            case "send_message":
              await this.handleSendMessage(ws, conversationId!, data, userId);
              break;

            case "typing":
              await this.handleTyping(ws, conversationId!, data, userId);
              break;

            case "mark_read":
              await this.handleMarkRead(ws, data.messageId, userId);
              break;
          }
        } catch (error: any) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: error.message,
            })
          );
        }
      },

      close: async (ws) => {
        const { userId, conversationId } = ws.data as WebSocketData;

        if (userId) {
          // Remove from connections
          const userConnections = this.connections.get(userId);
          if (userConnections) {
            userConnections.delete(ws);
            console.log(
              `Connection removed. Remaining connections for user ${userId}: ${userConnections.size}`
            );

            if (userConnections.size === 0) {
              this.connections.delete(userId);
              // Set user offline if no more connections
              await this.userService.setUserOffline(userId);
            }
          }

          // Remove from conversation
          if (conversationId) {
            const conversationUsers =
              this.conversationUsers.get(conversationId);
            if (conversationUsers) {
              conversationUsers.delete(userId);
              if (conversationUsers.size === 0) {
                this.conversationUsers.delete(conversationId);
              }
            }
          }

          console.log(`User ${userId} disconnected from chat WebSocket`);
        }
      },
    });
  }

  // Add this method to clean up dead connections
  private cleanupDeadConnections(userId: string) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const deadConnections = new Set();

      for (const ws of userConnections) {
        // Check if WebSocket is still alive
        if (
          ws.readyState === WebSocket.CLOSED ||
          ws.readyState === WebSocket.CLOSING
        ) {
          deadConnections.add(ws);
        }
      }

      // Remove dead connections
      for (const deadWs of deadConnections) {
        userConnections.delete(deadWs);
      }

      console.log(
        `Cleaned up ${deadConnections.size} dead connections for user ${userId}`
      );
    }
  }

  private async handleJoinConversation(
    ws: any,
    conversationId: string,
    userId: string
  ) {
    try {
      // Verify user has access to conversation
      await this.chatService.getConversation(conversationId, userId);

      // Add to conversation users
      if (!this.conversationUsers.has(conversationId)) {
        this.conversationUsers.set(conversationId, new Set());
      }
      this.conversationUsers.get(conversationId)!.add(userId);

      ws.data.conversationId = conversationId;

      // Notify other users in conversation
      this.broadcastToConversation(
        conversationId,
        {
          type: "user_joined",
          conversationId,
          data: { userId },
          timestamp: new Date(),
        },
        userId
      );

      ws.send(
        JSON.stringify({
          type: "joined_conversation",
          conversationId,
        })
      );
    } catch (error: any) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Failed to join conversation: ${error.message}`,
        })
      );
    }
  }

  private async handleLeaveConversation(
    ws: any,
    conversationId: string,
    userId: string
  ) {
    const conversationUsers = this.conversationUsers.get(conversationId);
    if (conversationUsers) {
      conversationUsers.delete(userId);
      if (conversationUsers.size === 0) {
        this.conversationUsers.delete(conversationId);
      }
    }

    ws.data.conversationId = undefined;

    // Notify other users
    this.broadcastToConversation(
      conversationId,
      {
        type: "user_left",
        conversationId,
        data: { userId },
        timestamp: new Date(),
      },
      userId
    );

    ws.send(
      JSON.stringify({
        type: "left_conversation",
        conversationId,
      })
    );
  }

  private async handleSendMessage(
    ws: any,
    conversationId: string,
    data: any,
    userId: string
  ) {
    try {
      const message = await this.chatService.sendMessage({
        conversationId,
        senderId: userId,
        content: data.content,
        type: data.type || "text",
        replyTo: data.replyTo,
      });

      // Broadcast to all users in conversation
      this.broadcastToConversation(conversationId, {
        type: "message",
        conversationId,
        data: message,
        timestamp: new Date(),
      });
    } catch (error: any) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Failed to send message: ${error.message}`,
        })
      );
    }
  }

  private async handleTyping(
    ws: any,
    conversationId: string,
    data: any,
    userId: string
  ) {
    // Broadcast typing indicator to other users
    this.broadcastToConversation(
      conversationId,
      {
        type: "typing",
        conversationId,
        data: { userId, isTyping: data.isTyping },
        timestamp: new Date(),
      },
      userId
    );
  }

  private async handleMarkRead(ws: any, messageId: string, userId: string) {
    try {
      await this.chatService.markAsRead(messageId, userId);

      const message = await this.chatService.getMessage(messageId, userId);

      // Broadcast read receipt
      this.broadcastToConversation(
        message.conversationId.toString(),
        {
          type: "read",
          conversationId: message.conversationId.toString(),
          data: { messageId, userId },
          timestamp: new Date(),
        },
        userId
      );
    } catch (error: any) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Failed to mark message as read: ${error.message}`,
        })
      );
    }
  }

  private broadcastToConversation(
    conversationId: string,
    event: ChatEvent,
    excludeUserId?: string
  ) {
    const conversationUsers = this.conversationUsers.get(conversationId);
    if (!conversationUsers) return;

    for (const userId of conversationUsers) {
      if (excludeUserId && userId === excludeUserId) continue;

      const userConnections = this.connections.get(userId);
      if (userConnections) {
        const deadConnections = new Set();

        for (const ws of userConnections) {
          try {
            // Check if connection is still alive before sending
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(event));
            } else {
              deadConnections.add(ws);
            }
          } catch (error) {
            console.error(`Failed to send message to user ${userId}:`, error);
            deadConnections.add(ws);
          }
        }

        // Remove dead connections
        for (const deadWs of deadConnections) {
          userConnections.delete(deadWs);
        }
      }
    }
  }

  // Add periodic cleanup method (optional)
  public startPeriodicCleanup() {
    setInterval(() => {
      for (const [userId, connections] of this.connections) {
        this.cleanupDeadConnections(userId);
        if (connections.size === 0) {
          this.connections.delete(userId);
        }
      }
    }, 60000); // Clean up every minute
  }
}
