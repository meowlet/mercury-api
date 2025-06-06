import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId | string;
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  isPremium: boolean;
  premiumExpiryDate?: Date;
  role?: ObjectId | Role | string;
  googleId?: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  _id?: ObjectId;
  name: string;
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
  FICTION = "fiction",
  STATISTIC = "statistic",
  TAG = "tag",
  COMMENT = "comment",
  RATING = "rating",
  CHAPTER = "chapter",
  FORUM = "forum",
  POST = "post",
  NOTIFICATION = "notification",
}

export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}
