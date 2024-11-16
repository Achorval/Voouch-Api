// src/services/user/tokenization.service.ts
import request from "../../utilities/request";
import { ErrorResponse } from "../../utilities/error";

interface TokenizeResponse {
  token: string;
  last4: string;
  bin: string;
  expMonth: string;
  expYear: string;
  brand: string;
  issuer: string;
}

interface ChargeResponse {
  reference: string;
  status: "success" | "failed" | "pending";
  message: string;
  transactionId: string;
  amount: string;
  currency: string;
  metadata?: Record<string, any>;
}

export class TokenizationService {
  private static readonly baseUrl = process.env.PAYMENT_PROVIDER_URL;
  private static readonly headers = {
    Authorization: `Bearer ${process.env.PAYMENT_PROVIDER_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  /**
   * Tokenize card with payment provider
   */
  static async tokenizeCard(data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    pin?: string;
  }): Promise<TokenizeResponse> {
    try {
      return await request<TokenizeResponse>(`${this.baseUrl}/tokenize`, {
        method: "POST",
        headers: this.headers,
        body: {
          card_number: data.cardNumber,
          expiry_month: data.expiryMonth,
          expiry_year: data.expiryYear,
          pin: data.pin,
        },
      });
    } catch (error: any) {
      const response = error.response;
      throw ErrorResponse.internal(
        response?.statusText || "Failed to tokenize card"
      );
    }
  }

  /**
   * Charge tokenized card
   */
  static async chargeToken(data: {
    token: string;
    amount: number;
    currency: string;
    reference: string;
    metadata?: Record<string, any>;
  }): Promise<ChargeResponse> {
    try {
      return await request<ChargeResponse>(`${this.baseUrl}/charge-token`, {
        method: "POST",
        headers: this.headers,
        body: {
          token: data.token,
          amount: data.amount,
          currency: data.currency,
          reference: data.reference,
          metadata: data.metadata,
        },
      });
    } catch (error: any) {
      const response = error.response;
      throw ErrorResponse.internal(
        response?.statusText || "Failed to charge card"
      );
    }
  }

  /**
   * Verify card tokenization status
   */
  static async verifyTokenization(
    reference: string
  ): Promise<TokenizeResponse> {
    try {
      return await request<TokenizeResponse>(
        `${this.baseUrl}/tokenize/verify/${reference}`,
        {
          method: "GET",
          headers: this.headers,
        }
      );
    } catch (error: any) {
      const response = error.response;
      throw ErrorResponse.internal(
        response?.statusText || "Failed to verify tokenization"
      );
    }
  }

  /**
   * Remove card token
   */
  static async removeToken(token: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/tokens/${token}`, {
        method: "DELETE",
        headers: this.headers,
      });
    } catch (error: any) {
      const response = error.response;
      throw ErrorResponse.internal(
        response?.statusText || "Failed to remove token"
      );
    }
  }
}
