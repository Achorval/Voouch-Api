// src/services/user/billPayment.service.ts
import { and, eq } from "drizzle-orm";
import { db } from "../../config/database";
import { ErrorResponse } from "../../utilities/error";
import {
  products,
  providers,
  productProviders,
  dataBundles,
  cablePackages,
  internetBundles,
  electricityDiscos,
} from "../../db/schema";
import {
  WalletService,
  BeneficiaryService,
  TransactionService,
} from "../../services/user";
import type {
  AirtimeRechargeInput,
  DataBundleInput,
  ElectricityPaymentInput,
  CableTvPaymentInput,
  InternetPaymentInput,
} from "../../types/user/billPayment.types";
import { Transaction } from "@/types/user/transaction.types";

export class BillPaymentService {
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

    // Get wallet and validate balance
    const wallet = await WalletService.getWallet(walletId);
    const balance = await WalletService.getBalance(walletId);

    if (parseFloat(balance) < input.amount) {
      throw ErrorResponse.badRequest("Insufficient balance");
    }

    // Save beneficiary if requested
    if (input.saveRecipient) {
      await BeneficiaryService.saveBeneficiary({
        userId,
        name: input.recipientName || input.phoneNumber,
        type: "phone_number",
        identifier: input.phoneNumber,
        details: {
          productId: input.productId,
          provider: productProvider.provider.name,
        },
      });
    }

    // Create transaction
    return await db.transaction(async (trx) => {
      // Debit wallet
      const newBalance = (parseFloat(balance) - input.amount).toFixed(4);
      await WalletService.updateBalance(walletId, newBalance, trx);

      // Create transaction record
      const transaction = await TransactionService.createTransaction(
        {
          userId,
          walletId,
          productId: input.productId,
          providerId: input.providerId,
          type: "debit",
          amount: input.amount,
          status: "pending",
          paymentMethod: "wallet",
          description: `Airtime recharge for ${input.phoneNumber}`,
          serviceData: {
            phoneNumber: input.phoneNumber,
            provider: productProvider.provider.name,
          },
        },
        trx
      );

      // Process with provider
      const providerResponse = await this.processWithProvider(
        productProvider,
        "recharge",
        {
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          reference: transaction.reference,
        }
      );

      // Update transaction status
      await TransactionService.updateTransaction(
        transaction.id,
        {
          status: providerResponse.status,
          providerData: providerResponse,
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
  ): Promise<Transaction> {
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
      throw ErrorResponse.notFound("Data bundle not found");
    }

    // Validate wallet balance
    const wallet = await WalletService.getWallet(walletId);
    const balance = await WalletService.getBalance(walletId);

    if (parseFloat(balance) < bundle.price) {
      throw ErrorResponse.badRequest("Insufficient balance");
    }

    // Save beneficiary if requested
    if (input.saveRecipient) {
      await BeneficiaryService.saveBeneficiary({
        userId,
        name: input.recipientName || input.phoneNumber,
        type: "phone_number",
        identifier: input.phoneNumber,
        details: {
          productId: input.productId,
          provider: productProvider.provider.name,
        },
      });
    }

    // Process transaction
    return await db.transaction(async (trx) => {
      // Debit wallet
      const newBalance = (parseFloat(balance) - bundle.price).toFixed(4);
      await WalletService.updateBalance(walletId, newBalance, trx);

      // Create transaction
      const transaction = await TransactionService.createTransaction(
        {
          userId,
          walletId,
          productId: input.productId,
          providerId: input.providerId,
          type: "debit",
          amount: bundle.price,
          status: "pending",
          paymentMethod: "wallet",
          description: `Data bundle purchase for ${input.phoneNumber}`,
          serviceData: {
            phoneNumber: input.phoneNumber,
            bundle: {
              name: bundle.name,
              allowance: bundle.allowance,
              validity: bundle.validity,
            },
          },
        },
        trx
      );

      // Process with provider
      const providerResponse = await this.processWithProvider(
        productProvider,
        "purchaseData",
        {
          phoneNumber: input.phoneNumber,
          bundleCode: bundle.code,
          reference: transaction.reference,
        }
      );

      // Update transaction
      await TransactionService.updateTransaction(
        transaction.id,
        {
          status: providerResponse.status,
          providerData: providerResponse,
        },
        trx
      );

      return transaction;
    });
  }

  /**
   * Pay Electricity Bill
   */
  static async payElectricityBill(
    userId: string,
    walletId: string,
    input: ElectricityPaymentInput
  ): Promise<Transaction> {
    // Validate product and provider
    const productProvider = await this.validateProductProvider(
      input.productId,
      input.providerId
    );

    // Get disco details
    const [disco] = await db
      .select()
      .from(electricityDiscos)
      .where(
        and(
          eq(electricityDiscos.id, input.discoId),
          eq(electricityDiscos.productId, input.productId)
        )
      )
      .limit(1);

    if (!disco) {
      throw ErrorResponse.notFound(
        "Electricity distribution company not found"
      );
    }

    // Validate wallet balance
    const wallet = await WalletService.getWallet(walletId);
    const balance = await WalletService.getBalance(walletId);

    if (parseFloat(balance) < input.amount) {
      throw ErrorResponse.badRequest("Insufficient balance");
    }

    // Validate meter number with provider
    const meterInfo = await this.processWithProvider(
      productProvider,
      "validateMeter",
      {
        meterNumber: input.meterNumber,
        vendType: input.vendType,
        disco: disco.identifier,
      }
    );

    // Save beneficiary if requested
    if (input.saveRecipient) {
      await BeneficiaryService.saveBeneficiary({
        userId,
        name: input.recipientName || meterInfo.customerName,
        type: "meter_number",
        identifier: input.meterNumber,
        details: {
          productId: input.productId,
          provider: productProvider.provider.name,
          disco: disco.identifier,
          vendType: input.vendType,
        },
      });
    }

    // Process transaction
    return await db.transaction(async (trx) => {
      // Debit wallet
      const newBalance = (parseFloat(balance) - input.amount).toFixed(4);
      await WalletService.updateBalance(walletId, newBalance, trx);

      // Create transaction
      const transaction = await TransactionService.createTransaction(
        {
          userId,
          walletId,
          productId: input.productId,
          providerId: input.providerId,
          type: "debit",
          amount: input.amount,
          status: "pending",
          paymentMethod: "wallet",
          description: `Electricity bill payment for ${input.meterNumber}`,
          serviceData: {
            meterNumber: input.meterNumber,
            vendType: input.vendType,
            disco: disco.identifier,
            customerName: meterInfo.customerName,
            address: meterInfo.address,
          },
        },
        trx
      );

      // Process with provider
      const providerResponse = await this.processWithProvider(
        productProvider,
        "purchaseElectricity",
        {
          meterNumber: input.meterNumber,
          vendType: input.vendType,
          disco: disco.identifier,
          amount: input.amount,
          reference: transaction.reference,
        }
      );

      // Update transaction
      await TransactionService.updateTransaction(
        transaction.id,
        {
          status: providerResponse.status,
          providerData: providerResponse,
        },
        trx
      );

      return transaction;
    });
  }

  /**
   * Pay Cable TV Bill
   */
  static async payCableTv(
    userId: string,
    walletId: string,
    input: CableTvPaymentInput
  ): Promise<Transaction> {
    // Validate product and provider
    const productProvider = await this.validateProductProvider(
      input.productId,
      input.providerId
    );

    // Get package details
    const [package_] = await db
      .select()
      .from(cablePackages)
      .where(
        and(
          eq(cablePackages.id, input.packageId),
          eq(cablePackages.productId, input.productId)
        )
      )
      .limit(1);

    if (!package_) {
      throw ErrorResponse.notFound("Cable package not found");
    }

    // Calculate total amount
    const totalAmount = input.addonCode
      ? package_.totalAmount + package_.addonPrice
      : package_.totalAmount;

    // Validate wallet balance
    const wallet = await WalletService.getWallet(walletId);
    const balance = await WalletService.getBalance(walletId);

    if (parseFloat(balance) < totalAmount) {
      throw ErrorResponse.badRequest("Insufficient balance");
    }

    // Process transaction
    // ... Similar pattern to above methods
  }

  // Helper methods
  private static async validateProductProvider(
    productId: string,
    providerId: string
  ) {
    const [productProvider] = await db
      .select({
        product: products,
        provider: providers,
        config: productProviders,
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
      throw ErrorResponse.notFound("Product provider configuration not found");
    }

    if (productProvider.product.maintenanceMode) {
      throw ErrorResponse.badRequest(
        productProvider.product.maintenanceMessage ||
          "Service currently under maintenance"
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
      return {};
    } catch (error) {
      throw ErrorResponse.internal("Provider service error");
    }
  }
}
