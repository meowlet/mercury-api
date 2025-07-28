```typescript
import { IFriendshipRepository } from './repositories/IFriendshipRepository';
import { IUserRepository } from './repositories/IUserRepository';
import { User } from './models/User';

export interface IFriendshipService {
  // ...existing methods...

  getBlockedUsers(userId: string): Promise<User[]>;

  // ...existing methods...
}

export class FriendshipService implements IFriendshipService {
  constructor(
    private friendshipRepository: IFriendshipRepository,
    private userRepository: IUserRepository
  ) {}

  // ...existing methods...

  async getBlockedUsers(userId: string): Promise<User[]> {
    return await this.friendshipRepository.getBlockedUsersByUserId(userId);
  }

  // ...existing methods...
}
```