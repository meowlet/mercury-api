import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId | string;
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  avatar?: string;
  isPremium: boolean;
  premiumExpiryDate?: Date;
  role?: ObjectId | Role | string;
  googleId?: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpiry?: Date;
  isOnline?: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Add these fields for friendship context
  friendshipId?: string;
  blockedAt?: Date; // For blocked users list
}

export interface Role {
  _id?: ObjectId | string;
  name: string;
  description?: string;
  code: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: Resource;
  actions: Action[];
}

export enum Resource {
  USER = "user",
  ROLE = "role",
  PERMISSION = "permission",
}

export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

export interface Friendship {
  _id?: ObjectId | string;
  requester: ObjectId | string;
  addressee: ObjectId | string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum FriendshipStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  BLOCKED = "blocked",
}
