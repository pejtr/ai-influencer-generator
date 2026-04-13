CREATE TABLE `affiliateClicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateCode` varchar(32) NOT NULL,
	`affiliateId` int,
	`referrerUrl` text,
	`landingPage` varchar(500),
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(100),
	`ipHash` varchar(64),
	`userAgent` text,
	`converted` boolean DEFAULT false,
	`convertedAt` timestamp,
	`convertedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateClicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliateDailyStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`affiliateCode` varchar(32) NOT NULL,
	`date` varchar(10) NOT NULL,
	`clicks` int NOT NULL DEFAULT 0,
	`uniqueClicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`revenue` decimal(10,2) NOT NULL DEFAULT '0',
	`commissions` decimal(10,2) NOT NULL DEFAULT '0',
	`level1Commissions` decimal(10,2) NOT NULL DEFAULT '0',
	`level2Commissions` decimal(10,2) NOT NULL DEFAULT '0',
	`level3Commissions` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliateDailyStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliatePayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paypalEmail` varchar(320) NOT NULL,
	`paypalTransactionId` varchar(255),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliatePayouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalImages` int NOT NULL,
	`completedImages` int NOT NULL DEFAULT 0,
	`failedImages` int NOT NULL DEFAULT 0,
	`basePrompt` text NOT NULL,
	`characterSettings` json,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`creditsUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `batchJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blogArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`featuredImageUrl` text,
	`metaTitle` varchar(70),
	`metaDescription` varchar(160),
	`keywords` text,
	`category` varchar(100) NOT NULL,
	`tags` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`authorId` int,
	`authorName` varchar(255),
	`viewCount` int NOT NULL DEFAULT 0,
	`readTimeMinutes` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogArticles_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogArticles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `channel_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('organic','paid','affiliate','direct','social') NOT NULL,
	`amount` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `characterLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`personalityId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `characterLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatContextCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`fanUserId` int NOT NULL,
	`personalityId` int NOT NULL,
	`recentSummary` text,
	`activeMemories` json,
	`activeKnowledge` json,
	`conversationMood` varchar(50),
	`engagementLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`suggestedTopics` json,
	`suggestedLinks` json,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatContextCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatContextCache_conversationId_unique` UNIQUE(`conversationId`)
);
--> statement-breakpoint
CREATE TABLE `chatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fanUserId` int NOT NULL,
	`personalityId` int NOT NULL,
	`creatorUserId` int NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	`fanSpent` decimal(10,2) NOT NULL DEFAULT '0.00',
	`lastMessageAt` timestamp,
	`status` enum('active','archived','blocked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('fan','ai','system') NOT NULL,
	`content` text NOT NULL,
	`hasContentOffer` boolean NOT NULL DEFAULT false,
	`offeredContentId` int,
	`isPaid` boolean NOT NULL DEFAULT false,
	`messageCost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fanUserId` int NOT NULL,
	`contentId` int NOT NULL,
	`creatorUserId` int NOT NULL,
	`conversationId` int,
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`creatorEarnings` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`status` enum('pending','completed','refunded') NOT NULL DEFAULT 'pending',
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentPurchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_vault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`contentType` enum('image','video','gallery','audio') NOT NULL DEFAULT 'image',
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`folder` varchar(200),
	`tags` json,
	`category` varchar(100),
	`defaultPpvPrice` decimal(10,2),
	`isExclusive` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`salesCount` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`timesSent` int NOT NULL DEFAULT 0,
	`fileSize` int,
	`duration` int,
	`width` int,
	`height` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_vault_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`fanUserId` int NOT NULL,
	`personalityId` int NOT NULL,
	`summary` text NOT NULL,
	`keyTopics` json,
	`emotionalTone` varchar(50),
	`messageRangeStart` int NOT NULL,
	`messageRangeEnd` int NOT NULL,
	`messageCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationSummaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_bonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`value` decimal(10,2) DEFAULT '0',
	`icon` varchar(100),
	`isActive` boolean DEFAULT true,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`paymentPlan` enum('full','installment') DEFAULT 'full',
	`amountPaid` decimal(10,2) DEFAULT '0',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `course_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` text,
	`content` text,
	`order` int NOT NULL DEFAULT 0,
	`duration` varchar(50),
	`isPreview` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`duration` varchar(50),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorEarnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`totalEarnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`pendingEarnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`paidEarnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`earningsFromContent` decimal(10,2) NOT NULL DEFAULT '0.00',
	`earningsFromTips` decimal(10,2) NOT NULL DEFAULT '0.00',
	`earningsFromMessages` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalFans` int NOT NULL DEFAULT 0,
	`totalConversations` int NOT NULL DEFAULT 0,
	`totalContentSold` int NOT NULL DEFAULT 0,
	`payoutMethod` enum('stripe','paypal','bank') NOT NULL DEFAULT 'stripe',
	`payoutEmail` varchar(320),
	`payoutThreshold` decimal(10,2) NOT NULL DEFAULT '50.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatorEarnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorFollows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`creatorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creatorFollows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditPacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`credits` int NOT NULL,
	`bonusCredits` int NOT NULL DEFAULT 0,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`stripePriceId` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditPacks_id` PRIMARY KEY(`id`),
	CONSTRAINT `creditPacks_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `daily_metric_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalUsers` int NOT NULL DEFAULT 0,
	`newUsers` int NOT NULL DEFAULT 0,
	`activeUsers` int NOT NULL DEFAULT 0,
	`totalRevenue` int NOT NULL DEFAULT 0,
	`subscriptionRevenue` int NOT NULL DEFAULT 0,
	`creditPackRevenue` int NOT NULL DEFAULT 0,
	`ppvRevenue` int NOT NULL DEFAULT 0,
	`tipRevenue` int NOT NULL DEFAULT 0,
	`totalGenerations` int NOT NULL DEFAULT 0,
	`imageGenerations` int NOT NULL DEFAULT 0,
	`videoGenerations` int NOT NULL DEFAULT 0,
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalConversations` int NOT NULL DEFAULT 0,
	`signupRate` int NOT NULL DEFAULT 0,
	`paidConversionRate` int NOT NULL DEFAULT 0,
	`churnRate` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_metric_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exclusiveContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`personalityId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`contentType` enum('image','video','gallery','message') NOT NULL DEFAULT 'image',
	`previewUrl` text,
	`fullUrl` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`totalSales` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exclusiveContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fan_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fanUserId` int NOT NULL,
	`creatorUserId` int NOT NULL,
	`engagementScore` int NOT NULL DEFAULT 0,
	`spendingTier` enum('whale','regular','casual','dormant','new') NOT NULL DEFAULT 'new',
	`lifetimeSpend` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalTips` int NOT NULL DEFAULT 0,
	`totalPurchases` int NOT NULL DEFAULT 0,
	`avgResponseTime` int NOT NULL DEFAULT 0,
	`lastActiveAt` timestamp,
	`timezone` varchar(50),
	`preferredLanguage` varchar(10),
	`interests` json,
	`notes` text,
	`tags` json,
	`isAtRisk` boolean NOT NULL DEFAULT false,
	`lastWinbackAt` timestamp,
	`winbackCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fan_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fanTips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fanUserId` int NOT NULL,
	`creatorUserId` int NOT NULL,
	`personalityId` int,
	`conversationId` int,
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`creatorEarnings` decimal(10,2) NOT NULL,
	`message` text,
	`stripePaymentIntentId` varchar(255),
	`status` enum('pending','completed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fanTips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stepId` varchar(50) NOT NULL,
	`stepLabel` varchar(100) NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`currentRate` int NOT NULL,
	`averageRate` int NOT NULL,
	`dropPercent` int NOT NULL,
	`message` text NOT NULL,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `influencerPersonalities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`personalityType` enum('flirty','friendly','mysterious','playful','sophisticated','bold') NOT NULL DEFAULT 'friendly',
	`chatStyle` enum('casual','formal','romantic','witty','seductive') NOT NULL DEFAULT 'casual',
	`responseLength` enum('short','medium','long') NOT NULL DEFAULT 'medium',
	`customTraits` json,
	`interests` json,
	`welcomeMessage` text,
	`autoResponseDelay` int NOT NULL DEFAULT 2000,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalConversations` int NOT NULL DEFAULT 0,
	`messageCount` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`isPublic` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`category` varchar(100),
	`style` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `influencerPersonalities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`contentType` enum('platform_feature','how_to','best_practice','faq','pricing','policy','tip','industry') NOT NULL,
	`category` varchar(100) NOT NULL,
	`tags` json,
	`embedding` json,
	`priority` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`trigger` enum('new_subscriber','inactive_days','purchase','tip','birthday','custom') NOT NULL,
	`triggerValue` varchar(100),
	`templateId` int,
	`messageContent` text,
	`audienceFilter` json,
	`delayMinutes` int NOT NULL DEFAULT 0,
	`sendAtOptimalTime` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalOpened` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`templateId` int,
	`messageContent` text NOT NULL,
	`audienceFilter` json,
	`attachedContentId` int,
	`ppvPrice` decimal(10,2),
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalOpened` int NOT NULL DEFAULT 0,
	`totalClicked` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`status` enum('draft','scheduled','sending','sent','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`category` enum('welcome','followup','promotion','winback','ppv','custom') NOT NULL DEFAULT 'custom',
	`variables` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ppv_price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`fanUserId` int,
	`price` decimal(10,2) NOT NULL,
	`wasAccepted` boolean NOT NULL DEFAULT false,
	`suggestedByAi` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ppv_price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presetLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`presetId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `presetLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presetMarketplace` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`promptData` json NOT NULL,
	`category` varchar(100),
	`tags` text,
	`previewImageUrl` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`likeCount` int NOT NULL DEFAULT 0,
	`useCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presetMarketplace_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pwaAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` enum('install_prompt_shown','install_prompt_accepted','install_prompt_dismissed','app_installed','offline_session_start','offline_session_end','notification_permission_granted','notification_permission_denied','notification_shown','notification_clicked','notification_dismissed','sw_registered','sw_update_available','sw_update_applied','page_view','session_start','session_end','scroll_depth','touch_interaction','viewport_change','generation_started','generation_completed','generation_failed','ab_variant_assigned','ab_install_clicked','ab_dismiss_clicked') NOT NULL,
	`metadata` json,
	`userAgent` text,
	`platform` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pwaAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`generationId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`caption` text,
	`hashtags` text,
	`status` enum('scheduled','published','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`fanvuePostId` varchar(255),
	`publishedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduledPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_traffic_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`platform` enum('tiktok','instagram','twitter','youtube','reddit','pinterest','other') NOT NULL,
	`referrerUrl` text,
	`landingPage` varchar(500),
	`didSignup` boolean NOT NULL DEFAULT false,
	`didGenerate` boolean NOT NULL DEFAULT false,
	`didPurchase` boolean NOT NULL DEFAULT false,
	`purchaseAmount` decimal(10,2),
	`sessionDuration` int,
	`pageViews` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_traffic_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`memberUserId` int NOT NULL,
	`role` enum('manager','chatter','moderator','viewer') NOT NULL DEFAULT 'chatter',
	`permissions` json,
	`messagesSent` int NOT NULL DEFAULT 0,
	`revenueGenerated` decimal(10,2) NOT NULL DEFAULT '0.00',
	`avgResponseTime` int NOT NULL DEFAULT 0,
	`activeConversations` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastActiveAt` timestamp,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255),
	`content` text NOT NULL,
	`avatarUrl` text,
	`rating` int DEFAULT 5,
	`isFeatured` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userMemories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fanUserId` int NOT NULL,
	`personalityId` int NOT NULL,
	`memoryType` enum('fact','preference','interest','relationship','goal','experience','context') NOT NULL,
	`category` varchar(100),
	`content` text NOT NULL,
	`confidence` decimal(3,2) NOT NULL DEFAULT '0.80',
	`sourceMessageId` int,
	`sourceConversationId` int,
	`timesUsed` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMemories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_touchpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('organic','paid','affiliate','direct','social') NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`utmSource` varchar(255),
	`utmMedium` varchar(255),
	`utmCampaign` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_touchpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_video_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`customImagePrompt` text,
	`customVideoPrompt` text,
	`customSettings` json,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_video_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`category` enum('cinematic_ads','emotional_atmospheric','action_adventure','dark_moody','timelapse','vfx_integration','character_animation','scene_transformation') NOT NULL,
	`imagePrompt` text NOT NULL,
	`videoPrompt` text NOT NULL,
	`negativePrompt` text,
	`style` varchar(100),
	`cameraMovement` varchar(100),
	`lighting` varchar(255),
	`aspectRatio` varchar(20) DEFAULT '16:9',
	`duration` int DEFAULT 5,
	`imageModel` varchar(100) DEFAULT 'nano_banana_pro',
	`videoModel` varchar(100) DEFAULT 'kling_3',
	`thumbnailUrl` text,
	`previewVideoUrl` text,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`tags` json,
	`usageCount` int NOT NULL DEFAULT 0,
	`avgRating` decimal(3,2) DEFAULT '0',
	`isFeatured` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `video_templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `workflow_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`modelId` varchar(100) NOT NULL DEFAULT 'kling_3',
	`genre` varchar(100),
	`speedRamp` varchar(100),
	`cinematicBible` text,
	`totalScenes` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`sceneNumber` int NOT NULL DEFAULT 1,
	`composition` text,
	`subject` text,
	`cameraMovement` varchar(200),
	`mood` varchar(200),
	`fullPrompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `creditTransactions` MODIFY COLUMN `type` enum('subscription_monthly','credit_pack_purchase','generation','video_generation','audio_generation','refund','bonus','daily_free','admin_adjustment') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `tier` enum('pro','creator') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `tier` enum('free','pro','creator') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `affiliateCommissions` ADD `purchaseId` int;--> statement-breakpoint
ALTER TABLE `affiliateCommissions` ADD `commissionRate` decimal(5,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliateCommissions` ADD `level` enum('1','2','3') DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliateCommissions` ADD `originalAmount` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `commissionRateLevel1` decimal(5,2) DEFAULT '30.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `commissionRateLevel2` decimal(5,2) DEFAULT '10.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `commissionRateLevel3` decimal(5,2) DEFAULT '5.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `earningsLevel1` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `earningsLevel2` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `earningsLevel3` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `level2Referrals` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `level3Referrals` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `badge` enum('none','bronze','silver','gold','diamond') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `achievements` json;--> statement-breakpoint
ALTER TABLE `affiliates` ADD `payoutThreshold` decimal(10,2) DEFAULT '50.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `creditPurchases` ADD `creditPackId` int;--> statement-breakpoint
ALTER TABLE `creditPurchases` ADD `stripeSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `creditPurchases` ADD `bonusCredits` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `creditPurchases` ADD `totalCredits` int NOT NULL;--> statement-breakpoint
ALTER TABLE `creditTransactions` ADD `creditSource` enum('free','paid','subscription') DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE `creditTransactions` ADD `balanceBefore` int NOT NULL;--> statement-breakpoint
ALTER TABLE `creditTransactions` ADD `metadata` json;--> statement-breakpoint
ALTER TABLE `generations` ADD `creditSource` enum('free','paid','subscription') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `generations` ADD `fanvuePostId` varchar(255);--> statement-breakpoint
ALTER TABLE `generations` ADD `publishedToFanvue` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `generations` ADD `scheduledPublishAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `monthlyCredits` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `creditBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `freeCreditsToday` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastFreeCreditsReset` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyCreditsRemaining` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyCreditsTotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastMonthlyReset` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `referredByLevel2` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `referredByLevel3` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `acquisitionChannel` enum('organic','paid','affiliate','direct','social') DEFAULT 'direct';--> statement-breakpoint
ALTER TABLE `users` ADD `utmSource` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `utmMedium` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `utmCampaign` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `fanvueAccessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `fanvueRefreshToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `fanvueUserId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `fanvueConnectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `affiliates` DROP COLUMN `commissionRate`;