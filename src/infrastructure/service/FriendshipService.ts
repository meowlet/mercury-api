import { IFriendshipService } from "../../domain/service/IFriendshipService";
import { IFriendshipRepository } from "../../domain/repository/IFriendshipRepository";
import { IUserRepository } from "../../domain/repository/IUserRepository";
import { Friendship, FriendshipStatus, User } from "../../domain/entity/User";
import { ErrorType, throwError } from "../../common/error/AppError";

export class FriendshipService implements IFriendshipService {
  constructor(
    private friendshipRepository: IFriendshipRepository,
    private userRepository: IUserRepository
  ) {}

  async sendFriendRequest(
    requesterId: string,
    addresseeId: string
  ): Promise<Friendship> {
    // Check if both users exist
    const [requester, addressee] = await Promise.all([
      this.userRepository.findById(requesterId),
      this.userRepository.findById(addresseeId),
    ]);

    if (!requester || !addressee) {
      throwError(ErrorType.NOT_FOUND, { message: "User not found" });
    }

    if (requesterId === addresseeId) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Cannot send friend request to yourself",
      });
    }

    // Check if friendship already exists
    const existingFriendship = await this.friendshipRepository.findByUsers(
      requesterId,
      addresseeId
    );
    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throwError(ErrorType.CONFLICT, { message: "Already friends" });
      } else if (existingFriendship.status === FriendshipStatus.PENDING) {
        throwError(ErrorType.CONFLICT, {
          message: "Friend request already sent",
        });
      } else if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throwError(ErrorType.FORBIDDEN, { message: "User is blocked" });
      }
    }

    const friendship: Friendship = {
      requester: requesterId,
      addressee: addresseeId,
      status: FriendshipStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.friendshipRepository.create(friendship);
  }

  async acceptFriendRequest(
    requestId: string,
    userId: string
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(requestId);
    if (!friendship) {
      throwError(ErrorType.NOT_FOUND, { message: "Friend request not found" });
    }

    if (friendship.addressee.toString() !== userId) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Not authorized to accept this request",
      });
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Request is not pending",
      });
    }

    return await this.friendshipRepository.updateStatus(
      requestId,
      FriendshipStatus.ACCEPTED
    );
  }

  async rejectFriendRequest(
    requestId: string,
    userId: string
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findById(requestId);
    if (!friendship) {
      throwError(ErrorType.NOT_FOUND, { message: "Friend request not found" });
    }

    if (friendship.addressee.toString() !== userId) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Not authorized to reject this request",
      });
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Request is not pending",
      });
    }

    return await this.friendshipRepository.updateStatus(
      requestId,
      FriendshipStatus.REJECTED
    );
  }

  async cancelFriendRequest(requestId: string, userId: string): Promise<void> {
    const friendship = await this.friendshipRepository.findById(requestId);
    if (!friendship) {
      throwError(ErrorType.NOT_FOUND, { message: "Friend request not found" });
    }

    if (friendship.requester.toString() !== userId) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Not authorized to cancel this request",
      });
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Request is not pending",
      });
    }

    await this.friendshipRepository.delete(requestId);
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    return await this.friendshipRepository.getBlockedUsersByUserId(userId);
  }

  async removeFriend(friendshipId: string, userId: string): Promise<void> {
    console.log(friendshipId, userId);
    const friendship = await this.friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throwError(ErrorType.NOT_FOUND, { message: "Friendship not found" });
    }

    const isParticipant =
      friendship.requester.toString() === userId ||
      friendship.addressee.toString() === userId;

    if (!isParticipant) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Not authorized to remove this friendship",
      });
    }

    if (friendship.status !== FriendshipStatus.ACCEPTED) {
      throwError(ErrorType.INVALID_REQUEST, { message: "Not friends" });
    }

    await this.friendshipRepository.delete(friendshipId);
  }

  async blockUser(userId: string, targetUserId: string): Promise<Friendship> {
    if (userId === targetUserId) {
      throwError(ErrorType.INVALID_REQUEST, {
        message: "Cannot block yourself",
      });
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throwError(ErrorType.NOT_FOUND, { message: "User not found" });
    }

    const existingFriendship = await this.friendshipRepository.findByUsers(
      userId,
      targetUserId
    );

    if (existingFriendship) {
      return await this.friendshipRepository.updateStatus(
        existingFriendship._id!.toString(),
        FriendshipStatus.BLOCKED
      );
    } else {
      const friendship: Friendship = {
        requester: userId,
        addressee: targetUserId,
        status: FriendshipStatus.BLOCKED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return await this.friendshipRepository.create(friendship);
    }
  }

  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    const friendship = await this.friendshipRepository.findByUsers(
      userId,
      targetUserId
    );
    if (!friendship || friendship.status !== FriendshipStatus.BLOCKED) {
      throwError(ErrorType.NOT_FOUND, { message: "User is not blocked" });
    }

    if (friendship.requester.toString() !== userId) {
      throwError(ErrorType.FORBIDDEN, {
        message: "Not authorized to unblock this user",
      });
    }

    await this.friendshipRepository.delete(friendship._id!.toString());
  }

  async getFriends(userId: string): Promise<User[]> {
    return await this.friendshipRepository.getFriendsByUserId(userId);
  }

  async getPendingRequests(userId: string): Promise<Friendship[]> {
    return await this.friendshipRepository.getPendingRequestsByUserId(userId);
  }

  async getSentRequests(userId: string): Promise<Friendship[]> {
    return await this.friendshipRepository.getSentRequestsByUserId(userId);
  }

  async getFriendshipStatus(
    userId: string,
    targetUserId: string
  ): Promise<FriendshipStatus | null> {
    const friendship = await this.friendshipRepository.findByUsers(
      userId,
      targetUserId
    );
    return friendship ? friendship.status : null;
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return await this.friendshipRepository.searchUsers(query, currentUserId);
  }
}
