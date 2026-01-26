import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

// Core user table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tier: mysqlEnum("tier", ["free", "starter", "pro", "business"]).default("free").notNull(),
  credits: int("credits").default(5).notNull(),
  monthlyCreditsUsed: int("monthlyCreditsUsed").default(0).notNull(),
  lastCreditReset: timestamp("lastCreditReset").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  affiliateCode: varchar("affiliateCode", { length: 32 }).unique(),
  referredBy: varchar("referredBy", { length: 32 }),
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
  tier: mysqlEnum("tier", ["starter", "pro", "business"]).notNull(),
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

// Affiliate program
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  affiliateCode: varchar("affiliateCode", { length: 32 }).notNull().unique(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("30.00").notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pendingEarnings: decimal("pendingEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  paidEarnings: decimal("paidEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  activeReferrals: int("activeReferrals").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "suspended"]).default("pending").notNull(),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
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
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type InsertAffiliateCommission = typeof affiliateCommissions.$inferInsert;

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
