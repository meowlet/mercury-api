import { Friendship, FriendshipStatus, User } from "../entity/User";

export interface IFriendshipRepository {
  create(friendship: Friendship): Promise<Friendship>;
  findById(id: string): Promise<Friendship | null>;
  findByUsers(
    requesterId: string,
    addresseeId: string
  ): Promise<Friendship | null>;
  updateStatus(id: string, status: FriendshipStatus): Promise<Friendship>;
  delete(id: string): Promise<void>;
  getFriendsByUserId(userId: string): Promise<User[]>;
  getPendingRequestsByUserId(userId: string): Promise<Friendship[]>;
  getSentRequestsByUserId(userId: string): Promise<Friendship[]>;
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
}
