[33mcommit 227b64aea7a071b0d740994e99c8d0932ce8e964[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Mon Jul 28 22:09:20 2025 +0700

    feat: Implement payment processing system with MoMo integration
    
    - Added IPaymentRepository and IPaymentService interfaces for payment handling.
    - Created PaymentRepository and PaymentService classes for managing payment data and logic.
    - Introduced MoMoService for handling MoMo payment requests and verifications.
    - Developed PaymentController for managing payment-related API endpoints.
    - Implemented PaymentWebhookController to handle payment notifications from MoMo and other gateways.
    - Added models for payment requests and responses.
    - Enhanced Friendship and User entities to support friendship context and blocking functionality.
    - Updated FriendshipService and FriendshipRepository to manage blocked users.
    - Created PremiumExpiryService to check and expire premium subscriptions periodically.
    - Added new routes for payment processing, confirmation, cancellation, and refunds.
    - Included tests for payment processing and webhook handling.

[33mcommit 21fd9f8f3be1ab0e97d65da98d7132a42182f16a[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jul 17 17:32:31 2025 +0700

    feat: Implement friendship management with repository, service, and controller, add friendship routes and WebSocket notifications

[33mcommit 11e8e96f6820aba3c9e11861ba68af25d08ead9c[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jul 17 16:00:33 2025 +0700

    feat: Enhance UserService with username and email uniqueness checks during updates, add online/offline status management, and last seen tracking
    
    feat: Register FileUploadService and UploadController in the dependency injection container
    
    feat: Implement upload routes in Router for handling avatar and attachment uploads
    
    feat: Add sign-out functionality in AuthController to clear user session
    
    feat: Extend ChatController to support file uploads in messages and manage attachments
    
    feat: Update MeController to include avatar retrieval and password change functionality
    
    feat: Create UploadController for managing file uploads and deletions
    
    feat: Enhance UserController with avatar retrieval and online user listing
    
    fix: Update AuthMiddleware to track last seen status for authenticated users
    
    feat: Improve ChatWebSocket to manage user connections and clean up dead connections

[33mcommit cd7623ba9527c4c41d5fc9070b6295e43025be9a[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Wed Jul 2 19:54:30 2025 +0700

    feat: enhance user response formatting and improve error handling in AuthService

[33mcommit 09000925a4e0d53325cbd090206a2bff744fa76a[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 23:22:21 2025 +0700

    feat: add MeController and integrate routes for user information retrieval

[33mcommit 6157b1da1692fae1642785039277d3976b0f5748[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 23:22:10 2025 +0700

    feat: enhance conversation management with member activation and type handling

[33mcommit 63f89c5c2a2e01e75ba3059c590be30bf57d31a1[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:36:06 2025 +0700

    refactor: clean up user entity permissions
    
    - Remove unused fiction-related permissions
    - Simplify Resource enum to core entities
    - Maintain backward compatibility
    - Fix ObjectId type consistency

[33mcommit 022c6903f1310999eba9997a7758f43695dd2196[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:38 2025 +0700

    feat: integrate chat routes and enhance middleware
    
    - Add chat routes and WebSocket to main router
    - Enhance AuthMiddleware to support query token
    - Improve error handling with detailed logging
    - Support both bearer token and query parameter auth

[33mcommit 1c823fd8ddd174b3a0b16a9ede2bbb4f0c560b60[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:34 2025 +0700

    feat: register chat services in DI container
    
    - Add chat repository registrations
    - Register ChatService and ChatController
    - Add ChatWebSocket to container
    - Update DIToken enum with chat tokens
    - Configure proper dependency injection

[33mcommit e2755d20be12b05fb550b6c67b153fc8817c4ede[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:31 2025 +0700

    feat: implement real-time chat WebSocket
    
    - Add ChatWebSocket for real-time messaging
    - Support conversation join/leave events
    - Handle message broadcasting to participants
    - Include typing indicators and read receipts
    - Add user presence tracking
    - Support real-time notifications

[33mcommit 0320173fc865cf43da2e6d49450191683819dfdf[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:28 2025 +0700

    feat: implement chat REST API controller
    
    - Add ChatController with full CRUD endpoints
    - Support conversation management endpoints
    - Add member management routes (add/remove/role)
    - Include message endpoints with pagination
    - Add search and utility endpoints
    - Implement file upload and read receipts

[33mcommit 5f027db899bb6b4831d0b2599a9393ba37e65013[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:25 2025 +0700

    feat: implement chat service with business logic
    
    - Implement ChatService with conversation management
    - Add permission-based member operations
    - Support message CRUD with validation
    - Include typing indicators and read receipts
    - Add search functionality and unread counts
    - Handle file attachments and reply messages

[33mcommit 9f9bb6ce1a78abe429303d67c86ab1977ad073a5[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:23 2025 +0700

    feat: implement chat repositories
    
    - Implement ConversationRepository with MongoDB operations
    - Implement MessageRepository with message CRUD
    - Add member management with role-based access
    - Support message search with text indexing
    - Include unread count and read receipt tracking
    - Handle conversation activity updates

[33mcommit 29b72a22e8c4db2c0c7914159395734451a7a264[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:19 2025 +0700

    feat: define chat service interface
    
    - Add IChatService with business logic operations
    - Support conversation and message management
    - Include member role management operations
    - Add search and utility methods
    - Define DTOs: CreateConversationData, SendMessageData

[33mcommit 5cf8ae470d72b112d341fd733503686690e99d2a[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:17 2025 +0700

    feat: define chat repository interfaces
    
    - Add IConversationRepository with CRUD operations
    - Add IMessageRepository with message management
    - Support conversation member management
    - Include search and unread count functionality
    - Define methods for direct conversation lookup

[33mcommit 6a81133c8872e448cae3b6e0cf040e3cdcbdac24[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:15 2025 +0700

    feat: define chat domain entities
    
    - Add Conversation interface with participants and metadata
    - Add Message interface with content, attachments, and read receipts
    - Add ConversationMember interface for role-based access
    - Define enums: ConversationType, MessageType, AttachmentType, MemberRole
    - Support for direct, group, and channel conversations
    - Include message editing, deletion, and read status tracking

[33mcommit d9c695523daa67778909ff208f3444da9252b2cb[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Thu Jun 12 14:35:12 2025 +0700

    feat: add CORS support
    
    - Install @elysiajs/cors plugin
    - Configure CORS middleware in main app
    - Enable cross-origin requests for API endpoints

[33mcommit 22c8f4ccfeb3bed3c60a2c17d69c946506d42555[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Tue Jun 10 23:38:59 2025 +0700

    chore: add bearer authentication dependency and environment config
    
    - Add @elysiajs/bearer plugin for token authentication
    - Update bun.lock with new dependencies
    - Add environment configuration file with JWT, MongoDB, SMTP, and payment settings

[33mcommit b749df42e6a33a2c4ad1039dfdf2524ef4445d43[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Tue Jun 10 23:38:56 2025 +0700

    feat(presentation): add user management and authentication
    
    - Create UserController with CRUD operations and permission checks
    - Add AuthMiddleware using bearer token authentication with resolve pattern
    - Update AuthController to return tokens in sign-in response
    - Register user routes in main router
    - Improve error handling by removing debug logging

[33mcommit 229b18f432fc9c1eaa1432af2827b24e69210a1c[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Tue Jun 10 23:38:53 2025 +0700

    feat(di): update container with role service and optimizations
    
    - Register RoleService with proper dependencies
    - Update repository class names for consistency
    - Add singleton configuration for service instances
    - Improve dependency injection structure

[33mcommit a1dc18078c4394fc777abaf8ce86cc05c2a37a2f[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Tue Jun 10 23:38:50 2025 +0700

    feat(infrastructure): implement role management infrastructure
    
    - Implement RoleRepository with MongoDB operations and user-role relationships
    - Rename MongoUserRepository to UserRepository for consistency
    - Create RoleService with permission checking and role validation logic
    - Update import references from MongoRoleRepository to RoleRepository
    - Add comprehensive error handling for role operations

[33mcommit 8b09aefb4fcac8f1dfd3e4a214eeb43cebb56f50[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Tue Jun 10 23:38:46 2025 +0700

    feat(domain): add role management to domain layer
    
    - Add ROLE_SERVICE to DIToken enum
    - Extend User entity with Role interface including description and code fields
    - Create IRoleRepository with full CRUD and user-role relationship methods
    - Create IRoleService with permission checking and role assignment logic
    - Update IUserService interface formatting

[33mcommit 673b721ef9c2791170fb9d2471f8b61c16b6e944[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:08:01 2025 +0700

    Create application entry point

[33mcommit 4ea266413d03a056ecbfbe2b4d3dfe820c51ae50[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Add error handling plugin and API router

[33mcommit fecfe8052b1cce4dfce2c95b3ca251ae60aafb63[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Create controllers for authentication and user management

[33mcommit d1cc2cefa6e6fc0175360de592b2321a4e667c5e[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Add dependency injection container

[33mcommit f7e5ce8556ff4f168c4218921967247a9931cdcb[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Implement core services: Auth, User and Email

[33mcommit b607ae45914a60f3aa9a96ba6701bb6ecfb0e642[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Add repositories for User, Role and Email

[33mcommit d59d639c244ad7f28d2a5c9f99e082190a0dab0a[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Setup MongoDB database connection

[33mcommit 48761faacb565ae3d04c575235cb4c1ed45c4c3f[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Implement domain layer with entities and interfaces

[33mcommit 3b746a3125ec6c78693b60a2764599cca3861cdd[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:17 2025 +0700

    Add common utilities, error handling and constants

[33mcommit 324f131607c0edd35a07c09e98e184f3da66ea5e[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Fri Jun 6 21:06:16 2025 +0700

    Initial project setup with dependencies and configuration

[33mcommit 9952c8df185a09c3224732007e83c410153124ee[m
Author: meowlet <ngoclink13@gmail.com>
Date:   Wed May 7 22:37:34 2025 +0700

    Initial commit (via bun create)
