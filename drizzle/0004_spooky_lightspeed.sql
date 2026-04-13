CREATE TABLE `instagram_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pageId` varchar(64) NOT NULL,
	`pageName` varchar(200),
	`instagramAccountId` varchar(64),
	`instagramUsername` varchar(200),
	`pageAccessToken` text NOT NULL,
	`tokenExpiresAt` timestamp,
	`webhookSubscribed` boolean NOT NULL DEFAULT false,
	`webhookVerifyToken` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instagram_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `instagram_connections_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `instagram_dm_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int NOT NULL,
	`commentId` varchar(128) NOT NULL,
	`commentText` text,
	`commenterUsername` varchar(200),
	`commenterInstagramId` varchar(64),
	`triggerKeyword` varchar(100),
	`dmContent` text,
	`messageId` varchar(256),
	`recipientId` varchar(128),
	`status` enum('sent','failed','skipped') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instagram_dm_logs_id` PRIMARY KEY(`id`)
);
