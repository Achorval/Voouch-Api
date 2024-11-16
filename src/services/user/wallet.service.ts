import { and, eq, between, desc, or, sql } from "drizzle-orm";
import { db } from "../../config/database";
import { wallets, balances, categories } from "../../db/schema";
import { currencies, transactions } from "../../db/schema";
import { ErrorResponse } from "../../utilities/error";
import { AuthUtils } from "../../utilities/auth";
import type {
  WalletResponse,
  WalletTransactionInput,
  TransferInput,
  BankTransferInput,
  MoneyRequestInput,
  WalletStatementFilters,
  WalletStatementResponse,
} from "../../types/user/wallet.types";
import crypto from "crypto";

export class WalletService {
  /**
   * Create wallet for specific currency
   */
  private static async createWallet(
    userId: string,
    currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    }
  ): Promise<WalletResponse> {
    // Check for existing wallet
    const [existingWallet] = await db
      .select()
      .from(wallets)
      .where(
        and(eq(wallets.userId, userId), eq(wallets.currencyId, currency.id))
      )
      .limit(1);

    if (existingWallet) {
      throw ErrorResponse.conflict("Wallet already exists for this currency");
    }

    // Start transaction
    return await db.transaction(async (trx) => {
      // Create wallet
      await trx.insert(wallets).values({
        userId,
        currencyId: currency.id,
        isDefault: currency.code === "NGN",
        status: "active",
      });

      // Get the created wallet
      const [createdWallet] = await trx
        .select({
          id: wallets.id,
          userId: wallets.userId,
          currencyId: wallets.currencyId,
          isDefault: wallets.isDefault,
          status: wallets.status,
        })
        .from(wallets)
        .where(
          and(eq(wallets.userId, userId), eq(wallets.currencyId, currency.id))
        )
        .orderBy(desc(wallets.createdAt))
        .limit(1);

      if (!createdWallet) {
        throw ErrorResponse.internal("Failed to create wallet");
      }

      // Create initial balance
      await trx.insert(balances).values({
        walletId: createdWallet.id,
        currencyId: currency.id,
        amount: "0.0000",
        isActive: true,
      });

      // Return wallet with currency details
      return {
        ...createdWallet,
        currency: {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
        },
      };
    });
  }

  /**
   * Get wallet balance
   */
  static async getBalance(walletId: string): Promise<string> {
    const [balance] = await db
      .select({
        amount: balances.amount,
      })
      .from(balances)
      .where(
        and(
          eq(balances.walletId, walletId), 
          eq(balances.isActive, true)
        )
      )
      .limit(1);

    if (!balance) {
      throw ErrorResponse.notFound("Wallet balance not found");
    }

    return balance.amount.toString();
  }

  /**
   * Update wallet balance
   */
  static async updateBalance(
    walletId: string,
    amount: string,
    trx: any
  ): Promise<void> {
    // Deactivate current balance
    await trx
      .update(balances)
      .set({ isActive: false })
      .where(and(eq(balances.walletId, walletId), eq(balances.isActive, true)));

    // Create new balance record
    await trx.insert(balances).values({
      walletId,
      currencyId: (await this.getWallet(walletId)).currencyId,
      amount,
      isActive: true,
    });
  }

  /**
   * Get wallet details
   */
  static async getWallet(walletId: string): Promise<WalletResponse> {
    const [wallet] = await db
      .select({
        id: wallets.id,
        userId: wallets.userId,
        currencyId: wallets.currencyId,
        isDefault: wallets.isDefault,
        status: wallets.status,
        currency: {
          code: currencies.code,
          name: currencies.name,
          symbol: currencies.symbol,
        },
      })
      .from(wallets)
      .leftJoin(currencies, eq(wallets.currencyId, currencies.id))
      .where(eq(wallets.id, walletId))
      .limit(1);

    if (!wallet) {
      throw ErrorResponse.notFound("Wallet not found");
    }

    return wallet as WalletResponse;
  }

  /**
   * Transfer between wallets
   */
  static async transfer(
    fromWalletId: string,
    input: TransferInput
  ): Promise<void> {
    const sourceWallet = await this.getWallet(fromWalletId);
    const currentBalance = await this.getBalance(fromWalletId);

    // Validate sufficient balance
    if (parseFloat(currentBalance) < input.amount) {
      throw ErrorResponse.badRequest("Insufficient balance");
    }

    // Get recipient wallet with matching currency
    const [recipientWallet] = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.userId, input.recipientId),
          eq(wallets.currencyId, sourceWallet.currencyId),
          eq(wallets.status, "active")
        )
      )
      .limit(1);

    if (!recipientWallet) {
      throw ErrorResponse.notFound("Recipient wallet not found");
    }

    // Get transfer category
    const [transferCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.code, 'wallet_to_wallet'))
      .limit(1);

    if (!transferCategory) {
      throw ErrorResponse.internal('Transfer category not configured');
    }

    // Start transaction
    await db.transaction(async (trx) => {
      // Debit sender
      const senderNewBalance = (
        parseFloat(currentBalance) - input.amount
      ).toFixed(4);
      await this.updateBalance(fromWalletId, senderNewBalance, trx);

      // Credit recipient
      const recipientCurrentBalance = await this.getBalance(recipientWallet.id);
      const recipientNewBalance = (
        parseFloat(recipientCurrentBalance) + input.amount
      ).toFixed(4);
      await this.updateBalance(recipientWallet.id, recipientNewBalance, trx);

      // Record transactions
      const reference = crypto.randomUUID();

      // Debit transaction
      await trx.insert(transactions).values({
        userId: sourceWallet.userId,
        walletId: fromWalletId,
        categoryId: transferCategory.id,
        type: "debit",
        amount: input.amount.toString(),
        fee: "0",
        total: input.amount.toString(),
        status: "completed",
        paymentMethod: "wallet",
        reference,
        description: input.description || "Wallet transfer",
        metadata: {
          transferType: "wallet",
          recipientId: input.recipientId,
        },
      });

      // Credit transaction
      await trx.insert(transactions).values({
        userId: recipientWallet.userId,
        walletId: recipientWallet.id,
        categoryId: transferCategory.id,
        type: "credit",
        amount: input.amount.toString(),
        fee: "0",
        total: input.amount.toString(),
        status: "completed",
        paymentMethod: "wallet",
        reference,
        description: input.description || "Wallet transfer",
        metadata: {
          transferType: "wallet",
          senderId: sourceWallet.userId,
        },
      });
    });
  }

  /**
   * Request money from another user
   */
  static async requestMoney(
    requesterId: string,
    input: MoneyRequestInput
  ): Promise<void> {
    // Get requester's default wallet
    const [requesterWallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, requesterId), eq(wallets.isDefault, true)))
      .limit(1);

    if (!requesterWallet) {
      throw ErrorResponse.notFound("Default wallet not found");
    }

    // Get money request category
    const [moneyRequetCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.code, 'money_request'))
      .limit(1);

    if (!moneyRequetCategory) {
      throw ErrorResponse.internal('Transfer category not configured');
    }

    // Record the money request as a pending transaction
    const reference = crypto.randomUUID();

    await db.insert(transactions).values({
      userId: input.userId, // The user being requested from
      walletId: null, // Will be set when request is accepted
      categoryId: moneyRequetCategory.id, 
      type: "debit",
      amount: input.amount.toString(),
      fee: "0",
      total: input.amount.toString(),
      status: "pending",
      paymentMethod: "wallet",
      reference,
      description: input.description || "Money request",
      metadata: {
        requestType: "money_request",
        requesterId,
        requesterWalletId: requesterWallet.id,
        expiresAt: input.expiresAt?.toISOString(),
        status: "pending",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * List money requests
   */
  static async listMoneyRequests(
    userId: string,
    type: "sent" | "received" = "received"
  ): Promise<any[]> {
    if (type === "received") {
      return db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            sql`JSON_EXTRACT(metadata, '$.requestType') = 'money_request'`
          )
        )
        .orderBy(desc(transactions.createdAt));
    } else {
      return db
        .select()
        .from(transactions)
        .where(
          and(
            sql`JSON_EXTRACT(metadata, '$.requesterId') = ${userId}`,
            sql`JSON_EXTRACT(metadata, '$.requestType') = 'money_request'`
          )
        )
        .orderBy(desc(transactions.createdAt));
    }
  }

  /**
   * Process money request response (accept/reject)
   */
  static async processMoneyRequest(
    transactionId: string,
    userId: string,
    action: "accept" | "reject",
    pin?: string
  ): Promise<void> {
    // Get the money request transaction
    const [request] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, userId),
          eq(transactions.status, "pending"),
          sql`JSON_EXTRACT(metadata, '$.requestType') = 'money_request'`
        )
      )
      .limit(1);

    if (!request) {
      throw ErrorResponse.notFound(
        "Money request not found or already processed"
      );
    }

    const metadata = request.metadata as any;
    if (!metadata?.requesterId || !metadata?.requesterWalletId) {
      throw ErrorResponse.internal("Invalid money request metadata");
    }

    // Check if request has expired
    if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
      await db
        .update(transactions)
        .set({
          status: "failed",
          metadata: {
            ...metadata,
            status: "expired",
          },
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));

      throw ErrorResponse.badRequest("Money request has expired");
    }

    if (action === "accept") {
      // Get source wallet (default wallet of user accepting the request)
      const [sourceWallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.isDefault, true)))
        .limit(1);

      if (!sourceWallet) {
        throw ErrorResponse.notFound("Default wallet not found");
      }

      // Get money request category
      const [moneyRequetCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.code, 'money_request'))
        .limit(1);

      if (!moneyRequetCategory) {
        throw ErrorResponse.internal('Transfer category not configured');
      }
      
      // Process transfer
      await db.transaction(async (trx) => {
        // Update request transaction
        await trx
          .update(transactions)
          .set({
            status: "completed",
            walletId: sourceWallet.id,
            metadata: {
              ...metadata,
              status: "accepted",
              processedAt: new Date().toISOString(),
            },
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(transactions.id, transactionId));

        // Create credit transaction for requester
        await trx.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: metadata.requesterId,
          walletId: metadata.requesterWalletId,
          categoryId: moneyRequetCategory.id,
          type: "credit",
          amount: request.amount,
          fee: "0",
          total: request.amount,
          status: "completed",
          paymentMethod: "wallet",
          reference: request.reference,
          description: request.description,
          metadata: {
            requestType: "money_request",
            status: "completed",
            senderId: userId,
          },
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update balances
        const currentBalance = await this.getBalance(sourceWallet.id);
        const senderNewBalance = (
          parseFloat(currentBalance) - parseFloat(request.amount)
        ).toFixed(4);
        await this.updateBalance(sourceWallet.id, senderNewBalance, trx);

        const requesterCurrentBalance = await this.getBalance(
          metadata.requesterWalletId
        );
        const requesterNewBalance = (
          parseFloat(requesterCurrentBalance) + parseFloat(request.amount)
        ).toFixed(4);
        await this.updateBalance(
          metadata.requesterWalletId,
          requesterNewBalance,
          trx
        );
      });
    } else {
      // Update request status to rejected
      await db
        .update(transactions)
        .set({
          status: "failed",
          metadata: {
            ...metadata,
            status: "rejected",
            processedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));
    }
  }

  /**
   * Generate wallet statement continued
   */
  static async generateStatement(
    walletId: string,
    filters: WalletStatementFilters
  ): Promise<WalletStatementResponse> {
    const conditions = [eq(transactions.walletId, walletId)];

    if (filters.startDate && filters.endDate) {
      conditions.push(
        between(transactions.createdAt, filters.startDate, filters.endDate)
      );
    }
    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters.minAmount) {
      conditions.push(
        sql`CAST(${transactions.amount} AS DECIMAL) >= ${filters.minAmount}`
      );
    }
    if (filters.maxAmount) {
      conditions.push(
        sql`CAST(${transactions.amount} AS DECIMAL) <= ${filters.maxAmount}`
      );
    }

    // Get transactions
    const statementTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        status: transactions.status,
        paymentMethod: transactions.paymentMethod,
        description: transactions.description,
        reference: transactions.reference,
        metadata: transactions.metadata,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt));

    // Calculate summary
    const [summary] = await db
      .select({
        totalCredit: sql<string>`CAST(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS CHAR)`,
        totalDebit: sql<string>`CAST(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS CHAR)`,
      })
      .from(transactions)
      .where(and(...conditions));

    // Get balances for opening and closing
    const [openingBalance] = await db
      .select({
        amount: balances.amount,
      })
      .from(balances)
      .where(
        and(
          eq(balances.walletId, walletId),
          filters.startDate
            ? sql`${balances.createdAt} <= ${filters.startDate}`
            : sql`1=1`
        )
      )
      .orderBy(desc(balances.createdAt))
      .limit(1);

    const [closingBalance] = await db
      .select({
        amount: balances.amount,
      })
      .from(balances)
      .where(
        and(
          eq(balances.walletId, walletId),
          filters.endDate
            ? sql`${balances.createdAt} <= ${filters.endDate}`
            : sql`1=1`
        )
      )
      .orderBy(desc(balances.createdAt))
      .limit(1);

    return {
      transactions: statementTransactions,
      summary: {
        totalCredit: summary?.totalCredit || "0",
        totalDebit: summary?.totalDebit || "0",
        openingBalance: openingBalance?.amount.toString() || "0",
        closingBalance: closingBalance?.amount.toString() || "0",
      },
      meta: {
        startDate: filters.startDate || new Date(0),
        endDate: filters.endDate || new Date(),
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Create wallets for user based on active currencies
   */
  static async createUserWallets(userId: string): Promise<WalletResponse[]> {
    // Get all active currencies
    const activeCurrencies = await db
      .select({
        id: currencies.id,
        code: currencies.code,
        name: currencies.name,
        symbol: currencies.symbol,
      })
      .from(currencies)
      .where(eq(currencies.isActive, true));

    if (!activeCurrencies.length) {
      throw ErrorResponse.internal("No active currencies configured");
    }

    // Create wallets for each currency
    const walletPromises = activeCurrencies.map((currency) =>
      this.createWallet(userId, currency)
    );

    // If NGN currency doesn't exist, set first wallet as default
    const hasNGN = activeCurrencies.some((currency) => currency.code === "NGN");
    if (!hasNGN && activeCurrencies.length > 0) {
      const createdWallets = await Promise.all(walletPromises);
      if (createdWallets.length > 0) {
        await this.setDefaultWallet(userId, createdWallets[0].id);
      }
    }

    return Promise.all(walletPromises);
  }

  /**
   * List user wallets
   */
  static async listWallets(userId: string): Promise<WalletResponse[]> {
    const userWallets = await db
      .select({
        id: wallets.id,
        userId: wallets.userId,
        currencyId: wallets.currencyId,
        isDefault: wallets.isDefault,
        status: wallets.status,
        currency: {
          code: currencies.code,
          name: currencies.name,
          symbol: currencies.symbol,
        },
      })
      .from(wallets)
      .leftJoin(currencies, eq(wallets.currencyId, currencies.id))
      .where(eq(wallets.userId, userId));

    return userWallets as WalletResponse[];
  }

  /**
   * Set default wallet
   */
  static async setDefaultWallet(
    userId: string,
    walletId: string
  ): Promise<void> {
    await db.transaction(async (trx) => {
      // Remove default from other wallets
      await trx
        .update(wallets)
        .set({ isDefault: false })
        .where(eq(wallets.userId, userId));

      // Set new default wallet
      await trx
        .update(wallets)
        .set({ isDefault: true })
        .where(eq(wallets.id, walletId));
    });
  }
}
