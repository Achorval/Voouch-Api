// src/services/user/billPayment.service.ts
import { and, eq } from 'drizzle-orm';
import { db } from '../../config/database';
import { ErrorResponse } from '../../utilities/error';
import { 
  products, 
  providers, 
  productProviders,
  dataBundles,
  cablePackages,
  internetBundles,
  electricityDiscos,
  transactions,
  wallets,
  balances
} from '../../db/schema';
import type { 
  AirtimeRechargeInput,
  DataBundleInput,
  ElectricityPaymentInput,
  CableTvPaymentInput,
  InternetPaymentInput
} from '../../types/user/billPayment.types';
import { Transaction } from '@/types/user/transaction.types';
import { TransactionService } from './transaction.service';

export class BillPaymentService {
  /**
   * Buy Airtime
   */
  static async buyAirtime12(
    userId: string,
    walletId: string,
    input: AirtimeRechargeInput
  ): Promise<any> {
    // Validate product and provider configuration
    const productProvider = await this.validateProductProvider(
      input.productId,
      input.providerId
    );

    // Validate wallet and balance
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.id, walletId))
      .limit(1);

    if (!wallet) {
      throw ErrorResponse.notFound('Wallet not found');
    }

    // Get current balance
    const [currentBalance] = await db
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.walletId, walletId),
          eq(balances.isActive, true)
        )
      )
      .limit(1);

    if (!currentBalance || parseFloat(currentBalance.amount) < input.amount) {
      throw ErrorResponse.badRequest('Insufficient balance');
    }

    // Process transaction
    return await db.transaction(async (trx) => {
      // Create transaction record
      const transactionId = crypto.randomUUID();
      const reference = `AIR${Date.now()}${Math.floor(Math.random() * 1000)}`;

      await trx
        .insert(transactions)
        .values({
          id: transactionId,
          userId,
          walletId,
          categoryId: productProvider.product.categoryId,
          productId: input.productId,
          providerId: input.providerId,
          type: 'debit',
          status: 'pending',
          amount: input.amount.toString(),
          fee: '0',
          total: input.amount.toString(),
          paymentMethod: 'wallet',
          reference,
          description: `Airtime recharge for ${input.phoneNumber}`,
          serviceData: {
            phoneNumber: input.phoneNumber,
            provider: productProvider.provider.name
          }
        });

      // Deactivate current balance
      await trx
        .update(balances)
        .set({ isActive: false })
        .where(eq(balances.id, currentBalance.id));

      // Create new balance record
      const newAmount = (parseFloat(currentBalance.amount) - input.amount).toFixed(4);
      await trx
        .insert(balances)
        .values({
          walletId,
          currencyId: currentBalance.currencyId,
          amount: newAmount,
          isActive: true
        });

      // Process with provider
      const providerResponse = await this.processWithProvider(
        productProvider,
        'recharge',
        {
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          reference
        }
      );

      // Update transaction status
      await trx
        .update(transactions)
        .set({
          status: providerResponse.status,
          providerData: providerResponse,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));

      // Get updated transaction
      const [transaction] = await trx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1);

      return transaction;
    });
  }


  /**
   * Buy Airtime
   */
  static async buyAirtime(
    userId: string,
    walletId: string,
    input: AirtimeRechargeInput
  ): Promise<Transaction> {
    // Validate product and provider configuration
    const productProvider = await this.validateProductProvider(
      input.productId,
      input.providerId
    );

    // Get current balance
    const [currentBalance] = await db
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.walletId, walletId),
          eq(balances.isActive, true)
        )
      )
      .limit(1);

    if (!currentBalance || parseFloat(currentBalance.amount) < input.amount) {
      throw ErrorResponse.badRequest('Insufficient balance');
    }

    // Process transaction
    return await db.transaction(async (trx) => {
      // Create transaction record
      const reference = `AIR${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const transaction = await TransactionService.createTransaction({
        userId,
        walletId,
        categoryId: productProvider.product.categoryId,
        productId: input.productId,
        providerId: input.providerId,
        type: 'debit',
        amount: input.amount,
        status: 'pending',
        paymentMethod: 'wallet',
        reference,
        description: `Airtime recharge for ${input.phoneNumber}`,
        serviceData: {
          phoneNumber: input.phoneNumber,
          provider: productProvider.provider.name
        }
      }, trx);

      // Deactivate current balance
      await trx
        .update(balances)
        .set({ isActive: false })
        .where(eq(balances.id, currentBalance.id));

      // Create new balance record
      const newAmount = (parseFloat(currentBalance.amount) - input.amount).toFixed(4);
      await trx
        .insert(balances)
        .values({
          walletId,
          currencyId: currentBalance.currencyId,
          amount: newAmount,
          isActive: true
        });

      // Process with provider
      const providerResponse = await this.processWithProvider(
        productProvider,
        'recharge',
        {
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          reference: transaction.reference
        }
      );

      // Update transaction status
      await TransactionService.updateTransaction(
        transaction.id,
        {
          status: providerResponse.status,
          providerData: providerResponse
        },
        trx
      );

      return transaction;
    });
  }

  /**
   * Buy Data Bundle
   */
  static async buyDataBundle(
    userId: string,
    walletId: string,
    input: DataBundleInput
  ): Promise<any> {
    // Validate product and provider
    const productProvider = await this.validateProductProvider(
      input.productId,
      input.providerId
    );

    // Get data bundle details
    const [bundle] = await db
      .select()
      .from(dataBundles)
      .where(
        and(
          eq(dataBundles.id, input.dataBundleId),
          eq(dataBundles.productId, input.productId)
        )
      )
      .limit(1);

    if (!bundle) {
      throw ErrorResponse.notFound('Data bundle not found');
    }

    // Get wallet and validate balance
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.id, walletId))
      .limit(1);

    if (!wallet) {
      throw ErrorResponse.notFound('Wallet not found');
    }

    // Get current balance
    const [currentBalance] = await db
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.walletId, walletId),
          eq(balances.isActive, true)
        )
      )
      .limit(1);

    if (!currentBalance || parseFloat(currentBalance.amount) < bundle.price) {
      throw ErrorResponse.badRequest('Insufficient balance');
    }

    // Process transaction
    return await db.transaction(async (trx) => {
      // Create transaction record
      const transactionId = crypto.randomUUID();
      const reference = `DAT${Date.now()}${Math.floor(Math.random() * 1000)}`;

      await trx
        .insert(transactions)
        .values({
          id: transactionId,
          userId,
          walletId,
          categoryId: productProvider.product.categoryId,
          productId: input.productId,
          providerId: input.providerId,
          type: 'debit',
          status: 'pending',
          amount: bundle.price.toString(),
          fee: '0',
          total: bundle.price.toString(),
          paymentMethod: 'wallet',
          reference,
          description: `Data bundle purchase for ${input.phoneNumber}`,
          serviceData: {
            phoneNumber: input.phoneNumber,
            bundle: {
              name: bundle.name,
              allowance: bundle.allowance,
              validity: bundle.validity
            }
          }
        });

      // Deactivate current balance
      await trx
        .update(balances)
        .set({ isActive: false })
        .where(eq(balances.id, currentBalance.id));

      // Create new balance record
      const newAmount = (parseFloat(currentBalance.amount) - bundle.price).toFixed(4);
      await trx
        .insert(balances)
        .values({
          walletId,
          currencyId: currentBalance.currencyId,
          amount: newAmount,
          isActive: true
        });

      // Process with provider
      const providerResponse = await this.processWithProvider(
        productProvider,
        'purchaseData',
        {
          phoneNumber: input.phoneNumber,
          bundleCode: bundle.code,
          reference
        }
      );

      // Update transaction status
      await trx
        .update(transactions)
        .set({
          status: providerResponse.status,
          providerData: providerResponse,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));

      // Get updated transaction
      const [transaction] = await trx
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1);

      return transaction;
    });
  }

  /**
   * Get product configs
   */
  static async getDataBundles(productId: string) {
    return db
      .select()
      .from(dataBundles)
      .where(eq(dataBundles.productId, productId))
      .orderBy(dataBundles.price);
  }

  static async getCableTvPackages(productId: string) {
    return db
      .select()
      .from(cablePackages)
      .where(eq(cablePackages.productId, productId))
      .orderBy(cablePackages.packagePrice);
  }

  static async getInternetBundles(productId: string) {
    return db
      .select()
      .from(internetBundles)
      .where(eq(internetBundles.productId, productId))
      .orderBy(internetBundles.amount);
  }

  static async getElectricityDiscos(productId: string) {
    return db
      .select()
      .from(electricityDiscos)
      .where(eq(electricityDiscos.productId, productId));
  }

  // Helper methods
  private static async validateProductProvider(productId: string, providerId: string) {
    const [productProvider] = await db
      .select({
        product: products,
        provider: providers,
        config: productProviders
      })
      .from(productProviders)
      .innerJoin(products, eq(products.id, productProviders.productId))
      .innerJoin(providers, eq(providers.id, productProviders.providerId))
      .where(
        and(
          eq(productProviders.productId, productId),
          eq(productProviders.providerId, providerId),
          eq(productProviders.isEnabled, true)
        )
      )
      .limit(1);

    if (!productProvider) {
      throw ErrorResponse.notFound('Product provider configuration not found');
    }

    if (productProvider.product.maintenanceMode) {
      throw ErrorResponse.badRequest(
        productProvider.product.maintenanceMessage || 
        'Service currently under maintenance'
      );
    }

    return productProvider;
  }

  private static async processWithProvider(
    productProvider: any,
    action: string,
    payload: Record<string, any>
  ) {
    try {
      // Use provider endpoints from configuration
      const endpoint = productProvider.config.endpoints[action];
      if (!endpoint) {
        throw new Error(`Provider endpoint not configured for ${action}`);
      }

      // Make API call to provider
      // Implementation depends on specific provider integration
      return {
        status: 'completed',
        reference: payload.reference,
        data: {}
      };
    } catch (error) {
      throw ErrorResponse.internal('Provider service error');
    }
  }
}