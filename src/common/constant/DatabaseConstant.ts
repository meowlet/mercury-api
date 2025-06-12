export class DatabaseConstant {
  public static readonly DATABASE_URI =
    Bun.env.MONGODB_URI || "mongodb://localhost:27017";
  public static readonly DATABASE_NAME = "himmel";

  public static readonly USER_COLLECTION = "users";
  public static readonly ROLE_COLLECTION = "roles";
  public static readonly FICTION_COLLECTION = "fictions";
  public static readonly CHAPTER_COLLECTION = "chapters";
  public static readonly COMMENT_COLLECTION = "comments";
  public static readonly RATING_COLLECTION = "ratings";
  public static readonly TAG_COLLECTION = "tags";
  public static readonly FORUM_COLLECTION = "forums";
  public static readonly POST_COLLECTION = "posts";
  public static readonly NOTIFICATION_COLLECTION = "notifications";

  // Chat collections
  public static readonly CONVERSATION_COLLECTION = "conversations";
  public static readonly MESSAGE_COLLECTION = "messages";
  static CONVERSATION_MEMBER_COLLECTION = "conversation_members";
}
