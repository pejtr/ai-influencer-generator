import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

// Core user table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tier: mysqlEnum("tier", ["free", "basic", "premium", "vip"]).default("free").notNull(),
  credits: int("credits").default(5).notNull(),
  monthlyCreditsUsed: int("monthlyCreditsUsed").default(0).notNull(),
  lastCreditReset: timestamp("lastCreditReset").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  affiliateCode: varchar("affiliateCode", { length: 32 }).unique(),
  referredBy: varchar("referredBy", { length: 32 }),
  referredByLevel2: varchar("referredByLevel2", { length: 32 }), // Level 2 referrer
  referredByLevel3: varchar("referredByLevel3", { length: 32 }), // Level 3 referrer
  // Fanvue integration (PREMIUM/VIP only)
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
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  // Fanvue publishing
  fanvuePostId: varchar("fanvuePostId", { length: 255 }),
  publishedToFanvue: boolean("publishedToFanvue").default(false).notNull(),
  scheduledPublishAt: timestamp("scheduledPublishAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

// Subscriptions
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull(),
  tier: mysqlEnum("tier", ["basic", "premium", "vip"]).notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Credit purchases (one-time)
export const creditPurchases = mysqlTable("creditPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull(),
  credits: int("credits").notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;

// Affiliate program - Enhanced with multi-level support
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  affiliateCode: varchar("affiliateCode", { length: 32 }).notNull().unique(),
  // Commission rates per level
  commissionRateLevel1: decimal("commissionRateLevel1", { precision: 5, scale: 2 }).default("30.00").notNull(),
  commissionRateLevel2: decimal("commissionRateLevel2", { precision: 5, scale: 2 }).default("10.00").notNull(),
  commissionRateLevel3: decimal("commissionRateLevel3", { precision: 5, scale: 2 }).default("5.00").notNull(),
  // Earnings tracking
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pendingEarnings: decimal("pendingEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  paidEarnings: decimal("paidEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Level-specific earnings
  earningsLevel1: decimal("earningsLevel1", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsLevel2: decimal("earningsLevel2", { precision: 10, scale: 2 }).default("0.00").notNull(),
  earningsLevel3: decimal("earningsLevel3", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Referral counts
  totalReferrals: int("totalReferrals").default(0).notNull(),
  activeReferrals: int("activeReferrals").default(0).notNull(),
  level2Referrals: int("level2Referrals").default(0).notNull(),
  level3Referrals: int("level3Referrals").default(0).notNull(),
  // Badges and achievements
  badge: mysqlEnum("badge", ["none", "bronze", "silver", "gold", "diamond"]).default("none").notNull(),
  achievements: json("achievements").$type<string[]>(),
  // Status and payout
  status: mysqlEnum("status", ["pending", "approved", "suspended"]).default("pending").notNull(),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  payoutThreshold: decimal("payoutThreshold", { precision: 10, scale: 2 }).default("50.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

// Affiliate commissions - Enhanced with level tracking
export const affiliateCommissions = mysqlTable("affiliateCommissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  subscriptionId: int("subscriptionId"),
  purchaseId: int("purchaseId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  level: mysqlEnum("level", ["1", "2", "3"]).default("1").notNull(), // Commission level
  originalAmount: decimal("originalAmount", { precision: 10, scale: 2 }).notNull(), // Original transaction amount
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

// Credit transactions log
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // positive = add, negative = deduct
  type: mysqlEnum("type", ["subscription", "purchase", "generation", "refund", "bonus", "monthly_reset"]).notNull(),
  description: text("description"),
  balanceAfter: int("balanceAfter").notNull(),
  relatedId: int("relatedId"), // ID of related generation, purchase, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// Scheduled posts for Fanvue (VIP only)
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

// Batch generation jobs (VIP only)
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
