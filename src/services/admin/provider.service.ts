// src/services/admin/provider.service.ts
import { and, eq, like, or, desc, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { providers } from '../../db/schema';
import { ErrorResponse } from '../../utilities/error';
import type { 
  CreateProviderDto,
  UpdateProviderDto,
  ProviderListQueryParams,
  ProviderListResponse,
  Provider
} from '../../types/admin/service.types';

export class ProviderService {
  /**
   * List service providers
   */
  static async listProviders(
    params: ProviderListQueryParams
  ): Promise<ProviderListResponse> {
    const {
      page = 1,
      limit = 10,
      isEnabled,
      isLive,
      search
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (isEnabled !== undefined) {
      conditions.push(eq(providers.isEnabled, isEnabled));
    }

    if (isLive !== undefined) {
      conditions.push(eq(providers.isLive, isLive));
    }

    if (search) {
      conditions.push(
        or(
          like(providers.name, `%${search}%`),
          like(providers.code, `%${search}%`),
          like(providers.description, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`
      })
      .from(providers)
      .where(whereClause);

    // Get providers
    const results = await db
      .select()
      .from(providers)
      .where(whereClause)
      .orderBy(desc(providers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      providers: results as Provider[],
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit
      }
    };
  }

  /**
   * Create service provider
   */
  static async createProvider(data: CreateProviderDto): Promise<Provider> {
    // Check if provider code exists
    const [existingProvider] = await db
      .select()
      .from(providers)
      .where(eq(providers.code, data.code.toUpperCase()))
      .limit(1);

    if (existingProvider) {
      throw ErrorResponse.conflict('Provider with this code already exists');
    }

    // Create provider
    await db
      .insert(providers)
      .values({
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        isEnabled: true,
        isLive: data.isLive,
        baseUrl: data.baseUrl,
        testBaseUrl: data.testBaseUrl,
        apiKey: data.apiKey,
        secretKey: data.secretKey,
        webhookSecret: data.webhookSecret
      });

    // Get created provider
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.code, data.code.toUpperCase()))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.internal('Failed to create provider');
    }

    return provider as Provider;
  }

  /**
   * Update service provider
   */
  static async updateProvider(
    id: string,
    data: UpdateProviderDto,
  ): Promise<Provider> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound('Provider not found');
    }

    // Update provider
    await db
      .update(providers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(providers.id, id));

    // Get updated provider
    const [updatedProvider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);

    if (!updatedProvider) {
      throw ErrorResponse.internal('Failed to update provider');
    }

    return updatedProvider as Provider;
  }

  /**
   * Get service provider
   */
  static async getProvider(id: string): Promise<Provider> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound('Provider not found');
    }

    return provider as Provider;
  }

  /**
   * Toggle provider status
   */
  static async toggleProvider(id: string): Promise<Provider> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound('Provider not found');
    }

    await db
      .update(providers)
      .set({
        isEnabled: !provider.isEnabled,
        updatedAt: new Date()
      })
      .where(eq(providers.id, id));

    return this.getProvider(id);
  }

  /**
   * Delete provider
   */
  static async deleteProvider(id: string): Promise<void> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound('Provider not found');
    }

    await db
      .delete(providers)
      .where(eq(providers.id, id));
  }
}