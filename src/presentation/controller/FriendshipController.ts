import { Elysia, t } from "elysia";
import { IFriendshipService } from "../../domain/service/IFriendshipService";
import { ResponseFormatter } from "../../common/util/ResponseFormatter";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

export class FriendshipController {
  constructor(private friendshipService: IFriendshipService) {}

  public routes() {
    return new Elysia()
      .use(AuthMiddleware)
      .get("/friends", async ({ userId }) => {
        const friends = await this.friendshipService.getFriends(userId);
        return ResponseFormatter.success({
          friends: friends.map((friend) =>
            ResponseFormatter.formatUserResponse(friend)
          ),
          message: "Friends retrieved successfully",
        });
      })

      .get("/friends/requests/pending", async ({ userId }) => {
        const requests = await this.friendshipService.getPendingRequests(
          userId
        );
        return ResponseFormatter.success({
          requests,
          message: "Pending requests retrieved successfully",
        });
      })

      .get("/friends/requests/sent", async ({ userId }) => {
        const requests = await this.friendshipService.getSentRequests(userId);
        return ResponseFormatter.success({
          requests,
          message: "Sent requests retrieved successfully",
        });
      })

      .get(
        "/friends/search",
        async ({ query: { q }, userId }) => {
          const users = await this.friendshipService.searchUsers(q, userId);
          const usersWithStatus = await Promise.all(
            users.map(async (user) => {
              const status = await this.friendshipService.getFriendshipStatus(
                userId,
                user._id!.toString()
              );
              return {
                ...ResponseFormatter.formatUserResponse(user),
                friendshipStatus: status,
              };
            })
          );

          return ResponseFormatter.success({
            users: usersWithStatus,
            message: "Users found successfully",
          });
        },
        {
          query: t.Object({
            q: t.String(),
          }),
        }
      )

      .post(
        "/friends/requests",
        async ({ body, userId }) => {
          const request = await this.friendshipService.sendFriendRequest(
            userId,
            body.userId
          );
          return ResponseFormatter.success({
            request,
            message: "Friend request sent successfully",
          });
        },
        {
          body: t.Object({
            userId: t.String(),
          }),
        }
      )

      .patch("/friends/requests/:id/accept", async ({ params, userId }) => {
        const friendship = await this.friendshipService.acceptFriendRequest(
          params.id,
          userId
        );
        return ResponseFormatter.success({
          friendship,
          message: "Friend request accepted successfully",
        });
      })

      .patch("/friends/requests/:id/reject", async ({ params, userId }) => {
        const friendship = await this.friendshipService.rejectFriendRequest(
          params.id,
          userId
        );
        return ResponseFormatter.success({
          friendship,
          message: "Friend request rejected successfully",
        });
      })

      .delete("/friends/requests/:id", async ({ params, userId }) => {
        await this.friendshipService.cancelFriendRequest(params.id, userId);
        return ResponseFormatter.success({
          message: "Friend request cancelled successfully",
        });
      })

      .delete("/friends/:id", async ({ params, userId }) => {
        await this.friendshipService.removeFriend(params.id, userId);
        return ResponseFormatter.success({
          message: "Friend removed successfully",
        });
      })

      .post(
        "/friends/block",
        async ({ body, userId }) => {
          const friendship = await this.friendshipService.blockUser(
            userId,
            body.userId
          );
          return ResponseFormatter.success({
            friendship,
            message: "User blocked successfully",
          });
        },
        {
          body: t.Object({
            userId: t.String(),
          }),
        }
      )

      .delete("/friends/block/:userId", async ({ params, userId }) => {
        await this.friendshipService.unblockUser(userId, params.userId);
        return ResponseFormatter.success({
          message: "User unblocked successfully",
        });
      });
  }
}
