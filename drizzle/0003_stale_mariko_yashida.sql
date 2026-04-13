CREATE TABLE `funnel_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`platform` enum('instagram','tiktok','youtube','facebook','twitter') NOT NULL DEFAULT 'instagram',
	`status` enum('active','paused','draft') NOT NULL DEFAULT 'draft',
	`description` text,
	`triggerCount` int NOT NULL DEFAULT 0,
	`dmSentCount` int NOT NULL DEFAULT 0,
	`conversionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('comment_detected','dm_sent','link_clicked','converted') NOT NULL,
	`commenterName` varchar(200),
	`triggerKeyword` varchar(100),
	`messageId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(100) NOT NULL,
	`matchType` enum('exact','contains','starts_with') NOT NULL DEFAULT 'contains',
	`caseSensitive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`messageType` enum('initial_dm','follow_up','conversion') NOT NULL DEFAULT 'initial_dm',
	`content` text NOT NULL,
	`delayMinutes` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_messages_id` PRIMARY KEY(`id`)
);
