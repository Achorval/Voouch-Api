// src/services/shared/webhook.service.ts
import { eq, and, lte, sql } from "drizzle-orm";
import { db } from "../../config/database";
import { webhookLogs, transactions, providers } from "../../db/schema";
import { WebhookEvent, WebhookEventType } from "../../types/common/webhook.types";
import { ErrorResponse } from "../../utilities/error";
import { TransactionService } from "../admin/transaction.service";
import { WalletService } from "../user/wallet.service";
import crypto from "node:crypto";

export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 5 * 60 * 1000; // 5 minutes

  /**
   * Verify webhook signature
   */
  static async verifyWebhookSignature(
    providerId: string,
    signature: string,
    payload: string
  ): Promise<boolean> {
    try {
      // Get provider secret key
      const [provider] = await db
        .select()
        .from(providers)
        .where(eq(providers.id, providerId))
        .limit(1);

      if (!provider?.webhookSecret) {
        throw ErrorResponse.badRequest(
          "Provider webhook secret not configured"
        );
      }

      const hmac = crypto
        .createHmac("sha512", provider.webhookSecret)
        .update(payload)
        .digest("hex");

      return hmac === signature;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  /**
   * Process incoming webhook
   */
  static async processWebhook(
    providerId: string,
    event: WebhookEvent,
    requestDetails: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: Record<string, any>;
      ipAddress?: string;
      signature?: string;
    }
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Get transaction from provider reference
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.externalReference, event.data.reference))
        .limit(1);

      if (!transaction) {
        throw new Error(
          `Transaction not found for reference: ${event.data.reference}`
        );
      }

      // Create webhook log entry
      const webhookLog = await db.insert(webhookLogs).values({
        transactionId: transaction.id,
        providerId,
        event: event.type as WebhookEventType,
        method: requestDetails.method,
        url: requestDetails.url,
        requestHeaders: requestDetails.headers,
        requestBody: requestDetails.body,
        ipAddress: requestDetails.ipAddress,
        signature: requestDetails.signature,
        status: "pending",
        providerReference: event.data.reference,
        metadata: event.data.metadata,
      });

      // Process based on event type
      await this.handleWebhookEvent(transaction.id, event);

      // Update webhook log with success
      const processingTime = Date.now() - startTime;
      await db
        .update(webhookLogs)
        .set({
          status: "processed",
          processingTime,
          responseStatus: 200,
          responseBody: { success: true },
          updatedAt: new Date(),
        })
        .where(eq(webhookLogs.id, webhookLog.insertId));
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      // Log error in webhook log
      await db
        .update(webhookLogs)
        .set({
          status: "failed",
          errorMessage: error.message,
          processingTime,
          responseStatus: error.statusCode || 500,
          responseBody: { error: error.message },
          updatedAt: new Date(),
        })
        .where(eq(webhookLogs.id, webhookLog.insertId));

      throw error;
    }
  }

  /**
   * Handle webhook event based on type
   */
  private static async handleWebhookEvent(
    transactionId: string,
    event: WebhookEvent
  ): Promise<void> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Handle different event types
    switch (event.type) {
      case "transfer.success":
      case "electricity.success":
      case "tv.success":
      case "data.success":
      case "airtime.success":
        await this.handleSuccessEvent(transaction, event);
        break;

      case "transfer.failed":
      case "electricity.failed":
      case "tv.failed":
      case "data.failed":
      case "airtime.failed":
        await this.handleFailureEvent(transaction, event);
        break;

      case "transfer.pending":
      case "electricity.pending":
      case "tv.pending":
      case "data.pending":
      case "airtime.pending":
        await this.handlePendingEvent(transaction, event);
        break;

      case "transfer.reversed":
        await this.handleReversalEvent(transaction, event);
        break;

      default:
        throw new Error(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle successful transaction
   */
  private static async handleSuccessEvent(
    transaction: any,
    event: WebhookEvent
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Update transaction status
      await TransactionService.updateTransactionStatus(
        transaction.id,
        "completed",
        "Transaction successful",
        {
          providerReference: event.data.reference,
          ...this.getServiceSpecificData(event),
        }
      );

      // Update wallet balance if necessary
      if (transaction.walletId && transaction.type === "debit") {
        await WalletService.updateBalance(
          transaction.walletId,
          "debit",
          transaction.amount
        );
      }
    });
  }

  /**
   * Handle failed transaction
   */
  private static async handleFailureEvent(
    transaction: any,
    event: WebhookEvent
  ): Promise<void> {
    await TransactionService.updateTransactionStatus(
      transaction.id,
      "failed",
      event.data.metadata?.failureReason || "Transaction failed",
      {
        providerReference: event.data.reference,
        failureReason: event.data.metadata?.failureReason,
      }
    );
  }

  /**
   * Handle pending transaction
   */
  private static async handlePendingEvent(
    transaction: any,
    event: WebhookEvent
  ): Promise<void> {
    await TransactionService.updateTransactionStatus(
      transaction.id,
      "processing",
      "Transaction pending",
      {
        providerReference: event.data.reference,
      }
    );
  }

  /**
   * Handle reversed transaction
   */
  private static async handleReversalEvent(
    transaction: any,
    event: WebhookEvent
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Update transaction status
      await TransactionService.updateTransactionStatus(
        transaction.id,
        "reversed",
        "Transaction reversed",
        {
          providerReference: event.data.reference,
          reversalReason: event.data.metadata?.reversalReason,
        }
      );

      // Refund wallet if necessary
      if (transaction.walletId && transaction.type === "debit") {
        await WalletService.updateBalance(
          transaction.walletId,
          "credit",
          transaction.amount
        );
      }
    });
  }

  /**
   * Get service-specific data from event
   */
  private static getServiceSpecificData(
    event: WebhookEvent
  ): Record<string, any> {
    const data: Record<string, any> = {};

    // Bank Transfer
    if (event.data.accountNumber) {
      data.accountNumber = event.data.accountNumber;
      data.accountName = event.data.accountName;
      data.bankCode = event.data.bankCode;
    }

    // Electricity
    if (event.data.meterNumber) {
      data.meterNumber = event.data.meterNumber;
      data.token = event.data.token;
      data.units = event.data.unit;
    }

    // TV Subscription
    if (event.data.smartCardNumber) {
      data.smartCardNumber = event.data.smartCardNumber;
      data.bouquet = event.data.bouquet;
      data.period = event.data.period;
    }

    // Data/Airtime
    if (event.data.phoneNumber) {
      data.phoneNumber = event.data.phoneNumber;
      data.network = event.data.network;
      data.plan = event.data.plan;
    }

    return data;
  }

  /**
   * Retry failed webhooks
   */
  static async retryFailedWebhooks(): Promise<void> {
    const failedWebhooks = await db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.status, "failed"),
          lte(webhookLogs.retryCount, this.MAX_RETRIES),
          lte(
            webhookLogs.lastRetryAt || webhookLogs.createdAt,
            new Date(Date.now() - this.RETRY_DELAY)
          )
        )
      );

    for (const webhook of failedWebhooks) {
      try {
        // Increment retry count
        await db
          .update(webhookLogs)
          .set({
            retryCount: sql`${webhookLogs.retryCount} + 1`,
            lastRetryAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(webhookLogs.id, webhook.id));

        // Retry webhook processing
        await this.handleWebhookEvent(webhook.transactionId, {
          id: webhook.id,
          type: webhook.event as WebhookEvent["type"],
          data: webhook.requestBody,
          createdAt: webhook.createdAt,
        });
      } catch (error) {
        console.error(`Failed to retry webhook ${webhook.id}:`, error);
      }
    }
  }
}
