// src/services/user/bin.service.ts
import request from '../../utilities/request';
import { ErrorResponse } from '../../utilities/error';

export interface BinDetails {
  scheme: string;       // visa, mastercard, etc.
  type: string;         // debit, credit
  brand: string | null;        // classic, platinum, etc.
  issuer: any;       // issuing bank
  country: any;      // issuing country
  isCommercial: boolean;
}

export class BinLookupService {
  private static readonly baseUrl = process.env.BIN_LOOKUP_URL;
  private static readonly headers = {
    Authorization: `Bearer ${process.env.BIN_LOOKUP_API_KEY}`,
    "Content-Type": "application/json",
  };

  private static readonly cache = new Map<string, BinDetails>();

  /**
   * Lookup BIN details
   */
  static async lookup(bin: string): Promise<BinDetails> {
    // Check cache first
    if (this.cache.has(bin)) {
      return this.cache.get(bin)!;
    }

    try {
      const response = await request<BinDetails>(
        `${this.baseUrl}/bin/${bin}`,
        {
          method: "GET",
          headers: this.headers,
        }
      );

      const details: BinDetails = {
        scheme: response.scheme.toLowerCase(),
        type: response.type.toLowerCase(),
        brand: response.brand || null,
        issuer: response.issuer?.name || null,
        country: response.country?.code || null,
        isCommercial: response.type === 'commercial'
      };

      // Cache the result
      this.cache.set(bin, details);

      return details;
    } catch (error: any) {
      throw ErrorResponse.internal(error.response?.data?.message || 'Failed to lookup BIN');
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}