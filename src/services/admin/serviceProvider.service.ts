// src/services/admin/service-provider.service.ts
import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database';
import { serviceProviders } from '../../db/schema';
import { ErrorResponse } from '../../utilities/error';
import type { 
  ServiceProvider,
  CreateServiceProviderDTO,
  UpdateServiceProviderDTO,
  ServiceProviderListOptions,
  ServiceProviderListResponse
} from '../../types/admin/serviceProvider.types';

export class ServiceProviderService {
  static async createServiceProvider(data: CreateServiceProviderDTO): Promise<ServiceProvider> {
    // Check if provider with same code exists
    const existing = await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.code, data.code.toUpperCase()))
      .limit(1);

    if (existing[0]) {
      throw ErrorResponse.conflict("Service provider with this code already exists");
    }

    try {
      // Start a transaction
      const result = await db.transaction(async (tx) => {
        // Insert service provider
        await tx
          .insert(serviceProviders)
          .values({
            name: data.name,
            code: data.code.toUpperCase(),
            categoryId: data.categoryId,
            isAirtimeEnabled: data.isAirtimeEnabled ?? false,
            isDataEnabled: data.isDataEnabled ?? false,
            isElectricityEnabled: data.isElectricityEnabled ?? false,
            isCableTvEnabled: data.isCableTvEnabled ?? false,
            isInternetEnabled: data.isInternetEnabled ?? false,
            isEnabled: true,
            metadata: data.metadata
          });

          // Get the newly inserted service provider within the same transaction
          const [newProvider] = await tx
              .select()
              .from(serviceProviders)
              .where(eq(serviceProviders.code, data.code.toUpperCase()))
              .limit(1);

          if (!newProvider) {
            throw ErrorResponse.internal("Failed to create service provider");
          }

            return newProvider;
        });

        return result as ServiceProvider;
      } catch (error) {
        throw ErrorResponse.internal("Failed to create service provider");
      }
  }

  static async updateServiceProvider(
    id: string,
    data: UpdateServiceProviderDTO
  ): Promise<ServiceProvider> {
    const [provider] = await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound("Service provider not found");
    }

    await db
      .update(serviceProviders)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(serviceProviders.id, id));

    // Fetch and return the updated service provider
    const [updatedProvider] = await db
    .select()
    .from(serviceProviders)
    .where(eq(serviceProviders.id, id))
    .limit(1);

    if (!updatedProvider) {
      throw ErrorResponse.internal("Failed to retrieve updated service provider");
    }

    return updatedProvider as ServiceProvider;
  }

  static async deleteServiceProvider(id: string): Promise<void> {
    const [provider] = await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound("Service provider not found");
    }

    await db
      .delete(serviceProviders)
      .where(eq(serviceProviders.id, id));
  }

  static async getServiceProvider(id: string): Promise<ServiceProvider> {
    const [provider] = await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound("Service provider not found");
    }

    return provider as ServiceProvider;
  }

  static async listServiceProviders(
    options: ServiceProviderListOptions
  ): Promise<ServiceProviderListResponse> {
    const { page, limit, categoryId, isEnabled } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = undefined;
    if (categoryId && isEnabled !== undefined) {
      whereConditions = and(
        eq(serviceProviders.categoryId, categoryId),
        eq(serviceProviders.isEnabled, isEnabled)
      );
    } else if (categoryId) {
      whereConditions = eq(serviceProviders.categoryId, categoryId);
    } else if (isEnabled !== undefined) {
      whereConditions = eq(serviceProviders.isEnabled, isEnabled);
    }

    // Get total count
    const totalResults = await db
      .select()
      .from(serviceProviders)
      .where(whereConditions);

    // Get paginated results
    const results = await db
      .select()
      .from(serviceProviders)
      .where(whereConditions)
      .limit(limit)
      .offset(offset);

    return {
      serviceProviders: results as ServiceProvider[],
      meta: {
        total: totalResults.length,
        pages: Math.ceil(totalResults.length / limit)
      }
    };
  }

  static async toggleServiceProvider(id: string): Promise<ServiceProvider> {
    const [provider] = await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.id, id))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound("Service provider not found");
    }

    await db
      .update(serviceProviders)
      .set({
        isEnabled: !provider.isEnabled,
        updatedAt: new Date()
      })
      .where(eq(serviceProviders.id, id));

    // Fetch and return the updated service provider
    const [updatedProvider] = await db
    .select()
    .from(serviceProviders)
    .where(eq(serviceProviders.id, id))
    .limit(1);

    if (!updatedProvider) {
      throw ErrorResponse.internal("Failed to retrieve updated category");
    }

    return updatedProvider as ServiceProvider;
  }
}