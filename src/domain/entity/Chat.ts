import { ObjectId } from "mongodb";
import { User } from "./User";

export interface Conversation {
  _id?: ObjectId | string;
  participants: ObjectId[] | string[];
  type: ConversationType;
  title?: string;
  description?: string;
  avatar?: string;
  isActive: boolean;
  lastMessage?: ObjectId | Message | string;
  lastActivity: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id?: ObjectId | string;
  conversationId: ObjectId | string;
  sender: ObjectId | User | string;
  content: string;
  type: MessageType;
  replyTo?: ObjectId | string;
  attachments?: MessageAttachment[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy: ReadReceipt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  size: number;
  mimeType: string;
}

export interface ReadReceipt {
  user: ObjectId;
  readAt: Date;
}

export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
  CHANNEL = "channel",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  SYSTEM = "system",
}

export enum AttachmentType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
}

export interface ConversationMember {
  _id?: ObjectId | string;
  conversation: ObjectId | string;
  user: ObjectId | User | string;
  role: MemberRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

export enum MemberRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}
