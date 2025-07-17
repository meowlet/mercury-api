import { Friendship, FriendshipStatus, User } from "../entity/User";

export interface IFriendshipService {
  sendFriendRequest(
    requesterId: string,
    addresseeId: string
  ): Promise<Friendship>;
  acceptFriendRequest(requestId: string, userId: string): Promise<Friendship>;
  rejectFriendRequest(requestId: string, userId: string): Promise<Friendship>;
  cancelFriendRequest(requestId: string, userId: string): Promise<void>;
  removeFriend(friendshipId: string, userId: string): Promise<void>;
  blockUser(userId: string, targetUserId: string): Promise<Friendship>;
  unblockUser(userId: string, targetUserId: string): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  getPendingRequests(userId: string): Promise<Friendship[]>;
  getSentRequests(userId: string): Promise<Friendship[]>;
  getFriendshipStatus(
    userId: string,
    targetUserId: string
  ): Promise<FriendshipStatus | null>;
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
}
