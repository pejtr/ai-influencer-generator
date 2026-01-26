CREATE TABLE `affiliateCommissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`subscriptionId` int,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateCommissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`affiliateCode` varchar(32) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '30.00',
	`totalEarnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`pendingEarnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`paidEarnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalReferrals` int NOT NULL DEFAULT 0,
	`activeReferrals` int NOT NULL DEFAULT 0,
	`status` enum('pending','approved','suspended') NOT NULL DEFAULT 'pending',
	`paypalEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `affiliates_affiliateCode_unique` UNIQUE(`affiliateCode`)
);
--> statement-breakpoint
CREATE TABLE `creditPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255) NOT NULL,
	`credits` int NOT NULL,
	`amountPaid` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditPurchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('subscription','purchase','generation','refund','bonus','monthly_reset') NOT NULL,
	`description` text,
	`balanceAfter` int NOT NULL,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`thumbnailUrl` text,
	`prompt` text NOT NULL,
	`characterSettings` json,
	`hasWatermark` boolean NOT NULL DEFAULT false,
	`creditsUsed` int NOT NULL DEFAULT 1,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`stripePriceId` varchar(255) NOT NULL,
	`tier` enum('starter','pro','business') NOT NULL,
	`status` enum('active','canceled','past_due','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tier` enum('free','starter','pro','business') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `credits` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyCreditsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastCreditReset` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `affiliateCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_affiliateCode_unique` UNIQUE(`affiliateCode`);