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
