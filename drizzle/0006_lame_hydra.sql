CREATE TABLE `brandVoiceDocs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL DEFAULT 'My Brand Voice',
	`tone` text NOT NULL DEFAULT (''),
	`vocabulary` text NOT NULL DEFAULT (''),
	`doNotSay` text NOT NULL DEFAULT (''),
	`sampleScripts` text NOT NULL DEFAULT (''),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brandVoiceDocs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentCalendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scriptId` int,
	`hookId` int,
	`title` varchar(200) NOT NULL,
	`platform` varchar(30) NOT NULL DEFAULT 'instagram',
	`scheduledDate` timestamp NOT NULL,
	`pipelineStatus` varchar(20) NOT NULL DEFAULT 'idea',
	`notes` text NOT NULL DEFAULT (''),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentCalendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedScripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brandVoiceDocId` int,
	`hook` text NOT NULL,
	`topic` text NOT NULL,
	`offerContext` text NOT NULL DEFAULT (''),
	`variationA` text NOT NULL DEFAULT (''),
	`variationB` text NOT NULL DEFAULT (''),
	`variationC` text NOT NULL DEFAULT (''),
	`selectedVariation` varchar(1),
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedScripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hookSwipeFile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hookText` text NOT NULL,
	`sourceNiche` varchar(100) NOT NULL DEFAULT '',
	`sourceUrl` text NOT NULL DEFAULT (''),
	`engagementRate` decimal(8,4) NOT NULL DEFAULT '0',
	`outlierScore` int NOT NULL DEFAULT 0,
	`tags` text NOT NULL DEFAULT (''),
	`notes` text NOT NULL DEFAULT (''),
	`timesUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hookSwipeFile_id` PRIMARY KEY(`id`)
);
