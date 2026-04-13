CREATE TABLE `pov_rebuild_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sceneDescription` text NOT NULL,
	`characterId` varchar(64) NOT NULL,
	`customCharacter` text,
	`emotion` varchar(64) NOT NULL,
	`targetModel` varchar(64) NOT NULL DEFAULT 'higgsfield',
	`generatedPrompt` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pov_rebuild_history_id` PRIMARY KEY(`id`)
);
