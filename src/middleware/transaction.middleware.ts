// middleware/transaction.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { and, eq, sql } from 'drizzle-orm';
import { tierLimits, users, security } from '../db/schema';
import { CustomError } from '../utilities/error';
import { verifyTransactionPin } from '../utilities/crypto';

export const checkPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { transactionPin } = req.body;
        if (!transactionPin) {
            throw new CustomError('Transaction PIN is required', 400);
        }

        const userSecurity = await db.query.security.findFirst({
            where: eq(security.userId, req.user.id)
        });

        if (!userSecurity?.isPinSet) {
            throw new CustomError('Transaction PIN not set', 400);
        }

        const isPinValid = await verifyTransactionPin(
            transactionPin,
            userSecurity.transactionPin,
            userSecurity.transactionPinSalt
        );

        if (!isPinValid) {
            throw new CustomError('Invalid transaction PIN', 401);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkTransactionLimits = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { amount } = req.body;
        const user = await db.query.users.findFirst({
            where: eq(users.id, req.user.id)
        });

        if (!user) {
            throw new CustomError('User not found', 404);
        }

        // Check tier limits
        const tierLimit = await db.query.tierLimits.findFirst({
            where: eq(tierLimits.level, user.kycLevel)
        });

        if (!tierLimit) {
            throw new CustomError('Tier limits not found', 404);
        }

        // Check daily transaction limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyTransactions = await db.query.transactions.findMany({
            where: and(
                eq(transactions.userId, req.user.id),
                eq(transactions.type, 'debit'),
                sql`DATE(createdAt) = CURDATE()`
            )
        });

        const dailyTotal = dailyTransactions.reduce(
            (sum, tx) => sum + Number(tx.amount),
            0
        );

        if (dailyTotal + Number(amount) > Number(tierLimit.dailyLimit)) {
            throw new CustomError(
                `Daily transaction limit of ${tierLimit.dailyLimit} exceeded`,
                400
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const validateWallet = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const walletId = req.params.walletId || req.params.fromWalletId;

        if (!walletId) {
            throw new CustomError('Wallet ID is required', 400);
        }

        const wallet = await db.query.wallets.findFirst({
            where: and(
                eq(wallets.id, walletId),
                eq(wallets.userId, req.user.id)
            )
        });

        if (!wallet) {
            throw new CustomError('Wallet not found', 404);
        }

        if (wallet.status !== 'active') {
            throw new CustomError('Wallet is not active', 400);
        }

        req.wallet = wallet;
        next();
    } catch (error) {
        next(error);
    }
};

export const validateBalance = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { amount } = req.body;
        const walletId = req.params.walletId || req.params.fromWalletId;

        const balance = await db.query.balances.findFirst({
            where: and(
                eq(balances.walletId, walletId),
                eq(balances.isActive, true)
            )
        });

        if (!balance) {
            throw new CustomError('Active balance not found', 404);
        }

        if (Number(balance.amount) < Number(amount)) {
            throw new CustomError('Insufficient balance', 400);
        }

        req.balance = balance;
        next();
    } catch (error) {
        next(error);
    }
};