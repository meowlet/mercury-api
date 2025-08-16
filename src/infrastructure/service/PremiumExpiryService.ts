import { IUserRepository } from "../../domain/repository/IUserRepository";

export class PremiumExpiryService {
  constructor(private userRepository: IUserRepository) {}

  async checkAndExpirePremium(): Promise<void> {
    try {
      // Find all premium users whose premium has expired
      const expiredUsers = await this.findExpiredPremiumUsers();

      console.log(`Found ${expiredUsers.length} expired premium users`);

      // Update their premium status
      for (const user of expiredUsers) {
        await this.userRepository.update(user._id!.toString(), {
          isPremium: false,
          premiumExpiryDate: undefined,
        });

        console.log(`Expired premium for user ${user._id}`);
      }
    } catch (error) {
      console.error("Error checking premium expiry:", error);
    }
  }

  private async findExpiredPremiumUsers() {
    // This would require a custom query method in UserRepository
    // For now, we'll simulate by getting all users and filtering
    const allUsers = await this.userRepository.findAll();

    return allUsers.filter(
      (user) =>
        user.isPremium &&
        user.premiumExpiryDate &&
        user.premiumExpiryDate < new Date()
    );
  }

  startPeriodicCheck(): void {
    // Check every hour
    setInterval(async () => {
      await this.checkAndExpirePremium();
    }, 60 * 60 * 1000);

    console.log("Premium expiry checker started - runs every hour");
  }
}
