import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

// Core user table - Updated for Hybrid Model
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Updated tier system: free, pro, creator
  tier: mysqlEnum("tier", ["free", "pro", "creator"]).default("free").notNull(),
  // Credit system - Hybrid model
  creditBalance: int("creditBalance").default(0).notNull(), // Paid credits balance
  freeCreditsToday: int("freeCreditsToday").default(5).notNull(), // Daily free credits (resets at midnight)
  lastFreeCreditsReset: timestamp("lastFreeCreditsReset").defaultNow().notNull(), // When free credits were last reset
  monthlyCreditsRemaining: int("monthlyCreditsRemaining").default(0).notNull(), // Monthly subscription credits
  monthlyCreditsTotal: int("monthlyCreditsTotal").default(0).notNull(), // Total monthly credits from subscription
  lastMonthlyReset: timestamp("lastMonthlyReset").defaultNow().notNull(), // When monthly credits were last reset
  // Legacy fields (keeping for backward compatibility)
  credits: int("credits").default(5).notNull(),
  monthlyCreditsUsed: int("monthlyCreditsUsed").default(0).notNull(),
  lastCreditReset: timestamp("lastCreditReset").defaultNow().notNull(),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  // Affiliate
  affiliateCode: varchar("affiliateCode", { length: 32 }).unique(),
  referredBy: varchar("referredBy", { length: 32 }),
  referredByLevel2: varchar("referredByLevel2", { length: 32 }),
  referredByLevel3: varchar("referredByLevel3", { length: 32 }),
  // Fanvue integration
  fanvueAccessToken: text("fanvueAccessToken"),
  fanvueRefreshToken: text("fanvueRefreshToken"),
  fanvueUserId: varchar("fanvueUserId", { length: 255 }),
  fanvueConnectedAt: timestamp("fanvueConnectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Generated influencers
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  prompt: text("prompt").notNull(),
  characterSettings: json("characterSettings"),
  hasWatermark: boolean("hasWatermark").default(false).notNull(),
  creditsUsed: int("creditsUsed").default(1).notNull(),
  creditSource: mysqlEnum("creditSource", ["free", "paid", "subscription"]).default("free").notNull(), // Track credit source
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  // Fanvue publishing
  fanvuePostId: varchar("fanvuePostId", { length: 255 }),
  publishedToFanvue: boolean("publishedToFanvue").default(false).notNull(),
  scheduledPublishAt: timestamp("scheduledPublishAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

// Subscriptions - Updated for new tiers
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull(),
  tier: mysqlEnum("tier", ["pro", "creator"]).notNull(), // Only paid tiers
  monthlyCredits: int("monthlyCredits").notNull(), // Credits included per month
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Credit Packs - One-time purchases
export const creditPacks = mysqlTable("creditPacks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  credits: int("credits").notNull(),
  bonusCredits: int("bonusCredits").default(0).notNull(), // Bonus credits (e.g., +33%)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditPack = typeof creditPacks.$inferSelect;
export type InsertCreditPack = typeof creditPacks.$inferInsert;

// Credit purchases (one-time) - Updated
export const creditPurchases = mysqlTable("creditPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creditPackId: int("creditPackId"), // Reference to credit pack
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  credits: int("credits").notNull(), // Base credits
  bonusCredits: int("bonusCredits").default(0).notNull(), // Bonus credits
  totalCredits: int("totalCredits").notNull(), // Total credits added
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;

// Credit transactions log - Enhanced
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // positive = add, negative = deduct
  type: mysqlEnum("type", [
    "subscription_monthly", // Monthly credits from subscription
    "credit_pack_purchase", // One-time credit pack purchase
    "generation", // Credit used for generation
    "video_generation", // Credit used for video generation
    "audio_generation", // Credit used for talking avatar audio
    "refund", // Refund
    "bonus", // Promotional bonus
    "daily_free", // Daily free credits
    "admin_adjustment" // Admin manual adjustment
  ]).notNull(),
  creditSource: mysqlEnum("creditSource", ["free", "paid", "subscription"]).default("paid").notNull(),
  description: text("description"),
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  relatedId: int("relatedId"), // ID of related generation, purchase, etc.
  metadata: json("metadata"), // Additional data (pack name, subscription tier, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// Affiliate program - Enhanced with multi-level support
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  affiliateCode: varchar("affiliateCode", { length: 32 }).notNull().unique(),
  commissionRateLevel1: decimal("commissionRateLevel1", { precision: 5, scale: 2 }).default("30.00").notNull(),
  commissionRateLevel2: decimal("commissionRateLevel2", { precision: 5, scale: 2 }).default("10.00").notNull(),
  commissionRateLevel3: decimal("commissionRateLevel3", { precision: 5, scale: 2 }).default("5.00").notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pendingEarnings: decimal("pendingEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  paidEarnings: decimal("paidEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsLevel1: decimal("earningsLevel1", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsLevel2: decimal("earningsLevel2", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsLevel3: decimal("earningsLevel3", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  activeReferrals: int("activeReferrals").default(0).notNull(),
  level2Referrals: int("level2Referrals").default(0).notNull(),
  level3Referrals: int("level3Referrals").default(0).notNull(),
  badge: mysqlEnum("badge", ["none", "bronze", "silver", "gold", "diamond"]).default("none").notNull(),
  achievements: json("achievements").$type<string[]>(),
  status: mysqlEnum("status", ["pending", "approved", "suspended"]).default("pending").notNull(),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  payoutThreshold: decimal("payoutThreshold", { precision: 10, scale: 2 }).default("50.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

// Affiliate commissions
export const affiliateCommissions = mysqlTable("affiliateCommissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  subscriptionId: int("subscriptionId"),
  purchaseId: int("purchaseId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  level: mysqlEnum("level", ["1", "2", "3"]).default("1").notNull(),
  originalAmount: decimal("originalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type InsertAffiliateCommission = typeof affiliateCommissions.$inferInsert;

// Affiliate payouts
export const affiliatePayouts = mysqlTable("affiliatePayouts", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paypalEmail: varchar("paypalEmail", { length: 320 }).notNull(),
  paypalTransactionId: varchar("paypalTransactionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type InsertAffiliatePayout = typeof affiliatePayouts.$inferInsert;

// Scheduled posts for Fanvue
export const scheduledPosts = mysqlTable("scheduledPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  generationId: int("generationId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags"),
  status: mysqlEnum("status", ["scheduled", "published", "failed", "cancelled"]).default("scheduled").notNull(),
  fanvuePostId: varchar("fanvuePostId", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// Batch generation jobs
export const batchJobs = mysqlTable("batchJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalImages: int("totalImages").notNull(),
  completedImages: int("completedImages").default(0).notNull(),
  failedImages: int("failedImages").default(0).notNull(),
  basePrompt: text("basePrompt").notNull(),
  characterSettings: json("characterSettings"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  creditsUsed: int("creditsUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;


// ============================================
// AI CHAT COMPANION TABLES
// ============================================

// AI Influencer Personalities - defines how the AI chatbot behaves
export const influencerPersonalities = mysqlTable("influencerPersonalities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Creator who owns this personality
  name: varchar("name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  // Personality traits
  personalityType: mysqlEnum("personalityType", ["flirty", "friendly", "mysterious", "playful", "sophisticated", "bold"]).default("friendly").notNull(),
  chatStyle: mysqlEnum("chatStyle", ["casual", "formal", "romantic", "witty", "seductive"]).default("casual").notNull(),
  responseLength: mysqlEnum("responseLength", ["short", "medium", "long"]).default("medium").notNull(),
  // Custom traits as JSON
  customTraits: json("customTraits").$type<string[]>(),
  interests: json("interests").$type<string[]>(),
  // Settings
  welcomeMessage: text("welcomeMessage"),
  autoResponseDelay: int("autoResponseDelay").default(2000).notNull(), // ms delay before responding
  isActive: boolean("isActive").default(true).notNull(),
  // Stats
  totalConversations: int("totalConversations").default(0).notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Explore/Discovery
  isPublic: boolean("isPublic").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  category: varchar("category", { length: 100 }), // fashion, fitness, lifestyle, business, etc.
  style: varchar("style", { length: 100 }), // realistic, anime, artistic, cinematic
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InfluencerPersonality = typeof influencerPersonalities.$inferSelect;
export type InsertInfluencerPersonality = typeof influencerPersonalities.$inferInsert;

// Chat conversations between fans and AI influencers
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  fanUserId: int("fanUserId").notNull(), // The fan chatting
  personalityId: int("personalityId").notNull(), // Which AI personality
  creatorUserId: int("creatorUserId").notNull(), // Creator who owns the personality
  // Stats
  messageCount: int("messageCount").default(0).notNull(),
  fanSpent: decimal("fanSpent", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  // Status
  status: mysqlEnum("status", ["active", "archived", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Individual chat messages
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["fan", "ai", "system"]).notNull(),
  content: text("content").notNull(),
  // For content recommendations
  hasContentOffer: boolean("hasContentOffer").default(false).notNull(),
  offeredContentId: int("offeredContentId"),
  // Payment for this message (pay-per-message model)
  isPaid: boolean("isPaid").default(false).notNull(),
  messageCost: decimal("messageCost", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Metadata
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Exclusive content that can be sold through chat
export const exclusiveContent = mysqlTable("exclusiveContent", {
  id: int("id").autoincrement().primaryKey(),
  creatorUserId: int("creatorUserId").notNull(),
  personalityId: int("personalityId"), // Optional - can be tied to specific personality
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  // Content
  contentType: mysqlEnum("contentType", ["image", "video", "gallery", "message"]).default("image").notNull(),
  previewUrl: text("previewUrl"), // Blurred/teaser version
  fullUrl: text("fullUrl").notNull(), // Actual content
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  // Stats
  totalSales: int("totalSales").default(0).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExclusiveContent = typeof exclusiveContent.$inferSelect;
export type InsertExclusiveContent = typeof exclusiveContent.$inferInsert;

// Content purchases by fans
export const contentPurchases = mysqlTable("contentPurchases", {
  id: int("id").autoincrement().primaryKey(),
  fanUserId: int("fanUserId").notNull(),
  contentId: int("contentId").notNull(),
  creatorUserId: int("creatorUserId").notNull(),
  conversationId: int("conversationId"), // If purchased through chat
  // Payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(), // 10%
  creatorEarnings: decimal("creatorEarnings", { precision: 10, scale: 2 }).notNull(), // 90%
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "refunded"]).default("pending").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type ContentPurchase = typeof contentPurchases.$inferSelect;
export type InsertContentPurchase = typeof contentPurchases.$inferInsert;

// Tips from fans to creators
export const fanTips = mysqlTable("fanTips", {
  id: int("id").autoincrement().primaryKey(),
  fanUserId: int("fanUserId").notNull(),
  creatorUserId: int("creatorUserId").notNull(),
  personalityId: int("personalityId"),
  conversationId: int("conversationId"),
  // Payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(), // 10%
  creatorEarnings: decimal("creatorEarnings", { precision: 10, scale: 2 }).notNull(), // 90%
  message: text("message"), // Optional tip message
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FanTip = typeof fanTips.$inferSelect;
export type InsertFanTip = typeof fanTips.$inferInsert;

// Creator earnings from chat companion
export const creatorEarnings = mysqlTable("creatorEarnings", {
  id: int("id").autoincrement().primaryKey(),
  creatorUserId: int("creatorUserId").notNull(),
  // Totals
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pendingEarnings: decimal("pendingEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  paidEarnings: decimal("paidEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Breakdown
  earningsFromContent: decimal("earningsFromContent", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsFromTips: decimal("earningsFromTips", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsFromMessages: decimal("earningsFromMessages", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Stats
  totalFans: int("totalFans").default(0).notNull(),
  totalConversations: int("totalConversations").default(0).notNull(),
  totalContentSold: int("totalContentSold").default(0).notNull(),
  // Payout
  payoutMethod: mysqlEnum("payoutMethod", ["stripe", "paypal", "bank"]).default("stripe").notNull(),
  payoutEmail: varchar("payoutEmail", { length: 320 }),
  payoutThreshold: decimal("payoutThreshold", { precision: 10, scale: 2 }).default("50.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreatorEarnings = typeof creatorEarnings.$inferSelect;
export type InsertCreatorEarnings = typeof creatorEarnings.$inferInsert;


// =====================================================
// CHATBOT MEMORY & RAG SYSTEM
// =====================================================

// Conversation summaries for long-term memory
export const conversationSummaries = mysqlTable("conversationSummaries", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  fanUserId: int("fanUserId").notNull(),
  personalityId: int("personalityId").notNull(),
  // Summary content
  summary: text("summary").notNull(), // AI-generated summary of conversation
  keyTopics: json("keyTopics").$type<string[]>(), // Main topics discussed
  emotionalTone: varchar("emotionalTone", { length: 50 }), // Overall emotional tone
  // Coverage
  messageRangeStart: int("messageRangeStart").notNull(), // First message ID in summary
  messageRangeEnd: int("messageRangeEnd").notNull(), // Last message ID in summary
  messageCount: int("messageCount").notNull(), // Number of messages summarized
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationSummary = typeof conversationSummaries.$inferSelect;
export type InsertConversationSummary = typeof conversationSummaries.$inferInsert;

// User facts/preferences extracted from conversations
export const userMemories = mysqlTable("userMemories", {
  id: int("id").autoincrement().primaryKey(),
  fanUserId: int("fanUserId").notNull(),
  personalityId: int("personalityId").notNull(),
  // Memory content
  memoryType: mysqlEnum("memoryType", [
    "fact", // Factual info about user (name, job, location)
    "preference", // User preferences (likes, dislikes)
    "interest", // Topics user is interested in
    "relationship", // Relationship status, family
    "goal", // User's goals or aspirations
    "experience", // Past experiences shared
    "context" // General context about the user
  ]).notNull(),
  category: varchar("category", { length: 100 }), // Sub-category for organization
  content: text("content").notNull(), // The actual memory
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80").notNull(), // How confident AI is (0-1)
  // Source tracking
  sourceMessageId: int("sourceMessageId"), // Message where this was extracted
  sourceConversationId: int("sourceConversationId"),
  // Usage tracking
  timesUsed: int("timesUsed").default(0).notNull(), // How often this memory was used
  lastUsedAt: timestamp("lastUsedAt"),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(), // User confirmed this is correct
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserMemory = typeof userMemories.$inferSelect;
export type InsertUserMemory = typeof userMemories.$inferInsert;

// Knowledge base for RAG system
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  // Content
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  contentType: mysqlEnum("contentType", [
    "platform_feature", // Features of the platform
    "how_to", // How-to guides
    "best_practice", // Best practices for creators
    "faq", // Frequently asked questions
    "pricing", // Pricing information
    "policy", // Platform policies
    "tip", // Tips and tricks
    "industry" // Industry knowledge about AI influencers
  ]).notNull(),
  // Categorization
  category: varchar("category", { length: 100 }).notNull(),
  tags: json("tags").$type<string[]>(),
  // For semantic search
  embedding: json("embedding").$type<number[]>(), // Vector embedding for similarity search
  // Metadata
  priority: int("priority").default(0).notNull(), // Higher = more important
  isActive: boolean("isActive").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

// Chat context cache for faster retrieval
export const chatContextCache = mysqlTable("chatContextCache", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().unique(),
  fanUserId: int("fanUserId").notNull(),
  personalityId: int("personalityId").notNull(),
  // Cached context
  recentSummary: text("recentSummary"), // Summary of recent messages
  activeMemories: json("activeMemories").$type<number[]>(), // IDs of relevant memories
  activeKnowledge: json("activeKnowledge").$type<number[]>(), // IDs of relevant knowledge
  conversationMood: varchar("conversationMood", { length: 50 }), // Current mood of conversation
  engagementLevel: mysqlEnum("engagementLevel", ["low", "medium", "high"]).default("medium").notNull(),
  // Suggested actions
  suggestedTopics: json("suggestedTopics").$type<string[]>(), // Topics to potentially bring up
  suggestedLinks: json("suggestedLinks").$type<{url: string, label: string, reason: string}[]>(), // Internal links to suggest
  // Timestamps
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type ChatContextCache = typeof chatContextCache.$inferSelect;
export type InsertChatContextCache = typeof chatContextCache.$inferInsert;


// ============================================
// EXPLORE / DISCOVERY SECTION (Foxy.ai inspired)
// ============================================

// Preset Marketplace - shareable prompt presets
export const presetMarketplace = mysqlTable("presetMarketplace", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Creator who made the preset
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  promptData: json("promptData").notNull(), // Full prompt configuration
  category: varchar("category", { length: 100 }), // portrait, action, scene, product, etc.
  tags: text("tags"), // Comma-separated tags
  previewImageUrl: text("previewImageUrl"),
  isPublic: boolean("isPublic").default(true).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  useCount: int("useCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PresetMarketplace = typeof presetMarketplace.$inferSelect;
export type InsertPresetMarketplace = typeof presetMarketplace.$inferInsert;

// Character Likes - track which characters users like
export const characterLikes = mysqlTable("characterLikes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personalityId: int("personalityId").notNull(), // Reference to influencerPersonalities
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CharacterLike = typeof characterLikes.$inferSelect;
export type InsertCharacterLike = typeof characterLikes.$inferInsert;

// Preset Likes - track which presets users like
export const presetLikes = mysqlTable("presetLikes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  presetId: int("presetId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PresetLike = typeof presetLikes.$inferSelect;
export type InsertPresetLike = typeof presetLikes.$inferInsert;

// Creator Follows - follow/unfollow creators
export const creatorFollows = mysqlTable("creatorFollows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(), // User who follows
  creatorId: int("creatorId").notNull(), // Creator being followed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreatorFollow = typeof creatorFollows.$inferSelect;
export type InsertCreatorFollow = typeof creatorFollows.$inferInsert;


// ============================================
// BLOG & SEO SYSTEM
// ============================================

// Blog articles for SEO and content marketing
export const blogArticles = mysqlTable("blogArticles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly slug
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"), // Short description for listings
  content: text("content").notNull(), // Full article content (Markdown)
  featuredImageUrl: text("featuredImageUrl"),
  // SEO fields
  metaTitle: varchar("metaTitle", { length: 70 }), // SEO title (max 70 chars)
  metaDescription: varchar("metaDescription", { length: 160 }), // SEO description (max 160 chars)
  keywords: text("keywords"), // Comma-separated keywords
  // Categorization
  category: varchar("category", { length: 100 }).notNull(), // tutorials, guides, news, case-studies
  tags: text("tags"), // Comma-separated tags
  // Publishing
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  // Author
  authorId: int("authorId"), // User ID of author (optional)
  authorName: varchar("authorName", { length: 255 }), // Display name
  // Stats
  viewCount: int("viewCount").default(0).notNull(),
  readTimeMinutes: int("readTimeMinutes").default(5).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogArticle = typeof blogArticles.$inferSelect;
export type InsertBlogArticle = typeof blogArticles.$inferInsert;
