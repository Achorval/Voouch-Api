// src/services/user/bank.service.ts
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "../../config/database";
import { categories, transactions, beneficiaries } from "../../db/schema";
import { WalletService } from "./wallet.service";
import { ErrorResponse } from "../../utilities/error";
import { BeneficiaryService } from "./beneficiary.service";
import type {
  BankAccount,
  BankTransferInput,
  BankTransferRequest,
  BankTransferResponse,
  InitiateTransferResponse,
  TransferQuote,
} from "../../types/user/bank.types";
import request from "../../utilities/request";

export class BankService {
  private static readonly baseUrl = process.env.BANK_API_URL;

  static async processBankTransfer(
    walletId: string,
    input: BankTransferInput
  ): Promise<BankTransferResponse> {
    // Verify bank account
    const accountDetails = await this.verifyAccount(
      input.bankCode,
      input.accountNumber
    );

    // Get bank transfer category
    const [bankCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.code, 'BANK_TRANSFER'))
      .limit(1);

    if (!bankCategory) {
      throw ErrorResponse.internal('Bank transfer category not configured');
    }
    
    // Get transfer quote
    const quote = await this.getTransferQuote(input.amount, input.bankCode);

    // Validate sufficient balance
    const wallet = await WalletService.getWallet(walletId);
    const currentBalance = await WalletService.getBalance(walletId);

    if (parseFloat(currentBalance) < (input.amount + quote.total)) {
      throw ErrorResponse.badRequest('Insufficient balance');
    }

    // Generate reference
    const reference = await this.generateTransferReference();

    // Process transfer
    return await db.transaction(async (trx) => {
      // Initiate bank transfer
      const transferResult = await this.initiateBankTransfer({
        reference,
        bankCode: input.bankCode,
        accountNumber: input.accountNumber,
        accountName: accountDetails.accountName,
        amount: input.amount,
        narration: input.description,
        currency: 'NGN'
      });

      // Update wallet balance
      const newBalance = (
        parseFloat(currentBalance) - 
        (input.amount + quote.total)
      ).toFixed(4);

      await WalletService.updateBalance(wallet.id, newBalance, trx);

      // Insert transaction
      await trx
        .insert(transactions)
        .values({
          userId: wallet.userId,
          walletId: wallet.id,
          categoryId: bankCategory.id,
          type: 'debit',
          amount: input.amount.toString(),
          fee: quote.total.toString(),
          total: (input.amount + quote.total).toString(),
          status: 'pending',
          paymentMethod: 'bank_transfer',
          reference,
          description: input.description || 'Bank transfer',
          metadata: {
            transferType: 'bank',
            bankCode: input.bankCode,
            accountNumber: input.accountNumber,
            accountName: accountDetails.accountName,
            sessionId: transferResult.sessionId,
            settlementTime: quote.settlementTime,
            fees: {
              processing: quote.fee,
              vat: quote.vat,
              total: quote.total
            }
          }
        });

      // Save beneficiary if requested
      if (input.saveAsBeneficiary) {
        await BeneficiaryService.saveBeneficiary(trx, {
          userId: wallet.userId,
          name: accountDetails.accountName,
          type: 'bank_account',
          identifier: accountDetails.accountNumber,
          details: {
            bankCode: accountDetails.bankCode,
            bankName: accountDetails.bankName,
            accountNumber: accountDetails.accountNumber,
            accountName: accountDetails.accountName
          }
        });
      }

      // Return transfer response
      return {
        reference,
        status: 'pending',
        amount: input.amount.toString(),
        fee: quote.total.toString(),
        total: (input.amount + quote.total).toString(),
        settlementTime: quote.settlementTime,
        recipientAccount: {
          bankCode: accountDetails.bankCode,
          bankName: accountDetails.bankName,
          accountNumber: accountDetails.accountNumber,
          accountName: accountDetails.accountName
        }
      };
    });
  }

  /**
   * Initiate bank transfer
   */
  private static async initiateBankTransfer(
    data: BankTransferRequest
  ): Promise<InitiateTransferResponse> {
    try {
      return await request<InitiateTransferResponse>(
        `${this.baseUrl}/transfers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.BANK_API_KEY}`
          },
          body: data
        }
      );
    } catch (error: any) {
      throw ErrorResponse.internal(error.message || 'Failed to initiate transfer');
    }
  }

  /**
   * Get transfer status
   */
  static async getTransferStatus(reference: string): Promise<{
    status: string;
    bankReference?: string;
    reason?: string;
  }> {
    try {
      return await request(
        `${this.baseUrl}/transfers/${reference}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.BANK_API_KEY}`
          }
        }
      );
    } catch (error: any) {
      throw ErrorResponse.internal(error.message || 'Failed to get transfer status');
    }
  }

  /**
   * Verify bank account
   */
  private static async verifyAccount(
    bankCode: string,
    accountNumber: string
  ): Promise<BankAccount> {
    try {
      return await request<BankAccount>(
        `${this.baseUrl}/banks/${bankCode}/accounts/${accountNumber}/verify`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.BANK_API_KEY}`
          }
        }
      );
    } catch (error: any) {
      throw ErrorResponse.internal(error.message || 'Failed to verify bank account');
    }
  }

  /**
   * Get transfer quote
   */
  private static async getTransferQuote(
    amount: number,
    bankCode: string
  ): Promise<TransferQuote> {
    try {
      return await request<TransferQuote>(
        `${this.baseUrl}/transfers/quote`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.BANK_API_KEY}`
          },
          body: {
            amount,
            bankCode,
            currency: 'NGN'
          }
        }
      );
    } catch (error: any) {
      throw ErrorResponse.internal(error.message || 'Failed to get transfer quote');
    }
  }

  /**
   * Calculate transfer fee including:
   * - Processing fee
   * - Bank charge
   * - VAT
   */
  private static async calculateTransferFee(
    amount: number,
    bankCode: string
  ): Promise<{
    processing: number;
    bank: number;
    vat: number;
    total: number;
  }> {
    const processingFee = amount * 0.0015; // 0.15%
    const bankCharge = 25; // Fixed charge
    const vat = (processingFee + bankCharge) * 0.075; // 7.5% VAT

    return {
      processing: processingFee,
      bank: bankCharge,
      vat,
      total: processingFee + bankCharge + vat
    };
  }

  /**
   * Generate unique transfer reference
   */
  private static async generateTransferReference(): Promise<string> {
    const [{ reference }] = await db
      .select({
        reference: sql<string>`CONCAT('BTF', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(LAST_INSERT_ID(), 6, '0'))`,
      })
      .from(sql`DUAL`);

    return reference;
  }

  /**
   * Get bank name from code
   */
  private static async getBankName(bankCode: string): Promise<string> {
    const banks: Record<string, string> = {
      '044': 'Access Bank',
      '057': 'Zenith Bank',
      '011': 'First Bank',
      // Add more banks
    };
    return banks[bankCode] || 'Unknown Bank';
  }

  /**
   * List user's bank beneficiaries
   */
  static async listBeneficiaries(userId: string) {
    return db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, userId))
      .orderBy(desc(beneficiaries.lastUsedAt));
  }
}
