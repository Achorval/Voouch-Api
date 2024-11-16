CREATE TABLE `atmCards` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`cardNumber` varchar(255) NOT NULL,
	`cardHolderName` varchar(255) NOT NULL,
	`last4Digits` varchar(4) NOT NULL,
	`expiryMonth` varchar(2) NOT NULL,
	`expiryYear` varchar(4) NOT NULL,
	`cvv` varchar(255) NOT NULL,
	`cardType` varchar(50) NOT NULL,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `atmCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`type` varchar(50) NOT NULL,
	`description` varchar(255),
	`source` varchar(20) NOT NULL,
	`clientId` varchar(255),
	`clientVersion` varchar(50),
	`deviceId` varchar(255),
	`deviceInfo` json,
	`ipAddress` varchar(45),
	`userAgent` varchar(255),
	`location` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `balances` (
	`id` varchar(128) NOT NULL,
	`walletId` varchar(128) NOT NULL,
	`currencyId` varchar(128) NOT NULL,
	`amount` decimal(19,4) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cablePackages` (
	`id` varchar(128) NOT NULL,
	`productId` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`cycle` tinyint NOT NULL,
	`packageCode` varchar(100) NOT NULL,
	`packagePrice` double(10,2) NOT NULL,
	`addonCode` varchar(100),
	`addonPrice` double(10,2) NOT NULL,
	`totalAmount` double(10,2) NOT NULL,
	CONSTRAINT `cablePackages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` varchar(255),
	`icon` varchar(255),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` varchar(128) NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`type` varchar(10) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `dataBundles` (
	`id` varchar(128) NOT NULL,
	`productId` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` double(10,2) NOT NULL,
	`validity` varchar(150),
	`allowance` varchar(150),
	`metadata` json,
	CONSTRAINT `dataBundles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `electricityDiscos` (
	`id` varchar(128) NOT NULL,
	`productId` varchar(128) NOT NULL,
	`vendType` varchar(50) NOT NULL,
	`identifier` varchar(100) NOT NULL,
	CONSTRAINT `electricityDiscos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internetBundles` (
	`id` varchar(128) NOT NULL,
	`productId` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(100) NOT NULL,
	`amount` double(10,2) NOT NULL,
	`validity` varchar(150),
	`allowance` varchar(150),
	CONSTRAINT `internetBundles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycs` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`level` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`bvn` varchar(11),
	`bvnVerified` boolean DEFAULT false,
	`idType` varchar(50),
	`idNumber` varchar(100),
	`idExpiryDate` varchar(10),
	`idFrontUrl` varchar(255),
	`idBackUrl` varchar(255),
	`address` varchar(255),
	`city` varchar(100),
	`lga` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`utilityBillUrl` varchar(255),
	`verifiedBy` varchar(128),
	`rejectionReason` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	CONSTRAINT `kycs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(128) NOT NULL,
	`categoryId` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` varchar(255),
	`icon` varchar(255),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`maintenanceMode` boolean NOT NULL DEFAULT false,
	`maintenanceMessage` varchar(255),
	`maintenanceStartTime` timestamp,
	`maintenanceEndTime` timestamp,
	`minimumAmount` decimal(19,2),
	`maximumAmount` decimal(19,2),
	`displayOrder` int NOT NULL DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referralSettings` (
	`id` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`configuration` json NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`startDate` timestamp,
	`endDate` timestamp,
	CONSTRAINT `referralSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`referralCode` varchar(20),
	`referredBy` varchar(128),
	`referralCount` int NOT NULL DEFAULT 0,
	`totalReferralEarnings` decimal(19,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `statusHistory` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`status` varchar(20) NOT NULL,
	`statusReason` varchar(255),
	`statusNote` varchar(500),
	`statusChangedBy` varchar(128),
	`suspensionEndAt` timestamp,
	`deactivatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `statusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` varchar(128) NOT NULL,
	`ticketNumber` varchar(50) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`assignedTo` varchar(128),
	`categoryId` varchar(128) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` varchar(1000) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'open',
	`priority` varchar(20) DEFAULT 'medium',
	`transactionId` varchar(128) NOT NULL,
	`attachments` json,
	`metadata` json,
	`lastRepliedAt` timestamp,
	`resolvedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `supportTickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
--> statement-breakpoint
CREATE TABLE `tierLimits` (
	`id` varchar(128) NOT NULL,
	`level` int NOT NULL,
	`dailyLimit` decimal(19,4) NOT NULL,
	`maximumBalance` decimal(19,4) NOT NULL,
	`requirements` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tierLimits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`type` varchar(50) NOT NULL,
	`token` varchar(255) NOT NULL,
	`device` varchar(255),
	`ipAddress` varchar(45),
	`userAgent` varchar(255),
	`isUsed` boolean NOT NULL DEFAULT false,
	`isRevoked` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`walletId` varchar(128),
	`categoryId` varchar(128) NOT NULL,
	`productId` varchar(128),
	`providerId` varchar(128),
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`type` enum('credit','debit') NOT NULL,
	`amount` decimal(19,4) NOT NULL,
	`fee` decimal(19,4) NOT NULL DEFAULT '0',
	`total` decimal(19,4) NOT NULL,
	`paymentMethod` varchar(20) NOT NULL,
	`cardId` varchar(128),
	`reference` varchar(255) NOT NULL,
	`externalReference` varchar(255),
	`description` varchar(255),
	`providerData` json,
	`serviceData` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(128) NOT NULL,
	`username` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`passwordSalt` varchar(255) NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`gender` varchar(10),
	`dateOfBirth` date,
	`avatar` varchar(255),
	`role` varchar(20) NOT NULL DEFAULT 'user',
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`kycLevel` int NOT NULL DEFAULT 0,
	`tier` varchar(20) NOT NULL DEFAULT 'basic',
	`isEmailVerified` boolean NOT NULL DEFAULT false,
	`isPhoneVerified` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phoneNumber_unique` UNIQUE(`phoneNumber`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`currencyId` varchar(128) NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loginAttempts` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`failedLoginAttempts` int NOT NULL DEFAULT 0,
	`currentLoginAttempts` int NOT NULL DEFAULT 0,
	`lastFailedLogin` timestamp,
	`lockoutUntil` timestamp,
	`lastLogin` timestamp,
	`lastActiveAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loginAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_providers` (
	`id` varchar(128) NOT NULL,
	`productId` varchar(128) NOT NULL,
	`providerId` varchar(128) NOT NULL,
	`providerProductCode` varchar(50) NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`feeType` varchar(20) NOT NULL,
	`feeValue` decimal(10,2) NOT NULL,
	`minFee` decimal(10,2),
	`maxFee` decimal(10,2),
	`endpoints` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` varchar(128) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` varchar(255),
	`logo` varchar(255),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`isLive` boolean NOT NULL DEFAULT false,
	`baseUrl` varchar(255) NOT NULL,
	`testBaseUrl` varchar(255),
	`apiKey` varchar(255),
	`secretKey` varchar(255),
	`webhookSecret` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `providers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `security` (
	`id` varchar(128) NOT NULL,
	`userId` varchar(128) NOT NULL,
	`transactionPin` varchar(255),
	`transactionPinSalt` varchar(255),
	`twoFactorSecret` varchar(255),
	`twoFactorEnabled` boolean NOT NULL DEFAULT false,
	`twoFactorMethod` varchar(20) DEFAULT 'email',
	`backupCodes` json,
	`canViewBalance` boolean NOT NULL DEFAULT true,
	`isPinSet` boolean NOT NULL DEFAULT false,
	`lastPasswordChange` timestamp,
	`lastPinChange` timestamp,
	`maxLoginAttempts` int NOT NULL DEFAULT 3,
	`lockoutDuration` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `atmCards` ADD CONSTRAINT `atmCards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `balances` ADD CONSTRAINT `balances_walletId_wallets_id_fk` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `balances` ADD CONSTRAINT `balances_currencyId_currencies_id_fk` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cablePackages` ADD CONSTRAINT `cablePackages_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataBundles` ADD CONSTRAINT `dataBundles_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `electricityDiscos` ADD CONSTRAINT `electricityDiscos_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internetBundles` ADD CONSTRAINT `internetBundles_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycs` ADD CONSTRAINT `kycs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycs` ADD CONSTRAINT `kycs_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `statusHistory` ADD CONSTRAINT `statusHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `statusHistory` ADD CONSTRAINT `statusHistory_statusChangedBy_users_id_fk` FOREIGN KEY (`statusChangedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supportTickets` ADD CONSTRAINT `supportTickets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supportTickets` ADD CONSTRAINT `supportTickets_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supportTickets` ADD CONSTRAINT `supportTickets_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supportTickets` ADD CONSTRAINT `supportTickets_transactionId_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_walletId_wallets_id_fk` FOREIGN KEY (`walletId`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_providerId_providers_id_fk` FOREIGN KEY (`providerId`) REFERENCES `providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_cardId_atmCards_id_fk` FOREIGN KEY (`cardId`) REFERENCES `atmCards`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_currencyId_currencies_id_fk` FOREIGN KEY (`currencyId`) REFERENCES `currencies`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `loginAttempts` ADD CONSTRAINT `loginAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_providers` ADD CONSTRAINT `product_providers_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_providers` ADD CONSTRAINT `product_providers_providerId_providers_id_fk` FOREIGN KEY (`providerId`) REFERENCES `providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `security` ADD CONSTRAINT `security_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;