// src/services/admin/product.service.ts
import { and, eq, like, or, desc, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { products, productProviders, categories, providers } from '../../db/schema';
import { ErrorResponse } from '../../utilities/error';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryParams,
  ProductListResponse,
  ProductProvider
} from '../../types/admin/service.types';

export class ProductService {
  /**
   * List products
   */
  static async listProducts(
    params: ProductListQueryParams
  ): Promise<ProductListResponse> {
    const {
      page = 1,
      limit = 10,
      categoryId,
      isEnabled,
      maintenanceMode,
      search
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (isEnabled !== undefined) {
      conditions.push(eq(products.isEnabled, isEnabled));
    }

    if (maintenanceMode !== undefined) {
      conditions.push(eq(products.maintenanceMode, maintenanceMode));
    }

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.code, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`
      })
      .from(products)
      .where(whereClause);

    const results = await db
      .select({
        product: products,
        category: {
          id: categories.id,
          name: categories.name,
          code: categories.code
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      products: results.map(r => ({ ...r.product, category: r.category })),
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit
      }
    };
  }

  /**
   * Create product
   */
  static async createProduct(
    data: CreateProductDto,
  ): Promise<Product> {
    // Check if product code exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.code, data.code.toUpperCase()))
      .limit(1);

    if (existingProduct) {
      throw ErrorResponse.conflict('Product with this code already exists');
    }

    // Validate category
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);

    if (!category) {
      throw ErrorResponse.badRequest('Invalid category');
    }

    await db
      .insert(products)
      .values({
        categoryId: data.categoryId,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        minimumAmount: data.minimumAmount?.toString() || '0.00',
        maximumAmount: data.maximumAmount?.toString() || '0.00',
        displayOrder: data.displayOrder || 0,
        metadata: data.metadata || {}
      });

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.code, data.code.toUpperCase()))
      .limit(1);

    if (!product) {
      throw ErrorResponse.internal('Failed to create product');
    }

    return product as Product;
  }

  /**
   * Update product
   */
  static async updateProduct(
    id: string,
    data: UpdateProductDto
  ): Promise<Product> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw ErrorResponse.notFound('Product not found');
    }

    await db
      .update(products)
      .set({
        ...data
      })
      .where(eq(products.id, id));

    const [updatedProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!updatedProduct) {
      throw ErrorResponse.internal('Failed to update product');
    }

    return updatedProduct as Product;
  }

  /**
   * Toggle product status
   */
  static async toggleStatus(id: string): Promise<Product> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw ErrorResponse.notFound('Product not found');
    }

    await db
      .update(products)
      .set({
        isEnabled: !product.isEnabled
      })
      .where(eq(products.id, id));

    return this.getProduct(id);
  }
  
  /**
   * Configure product provider
   */
  static async configureProvider(
    productId: string,
    providerId: string,
    config: {
      providerProductCode: string;
      priority: number;
      isDefault: boolean;
      feeType: 'flat' | 'percentage';
      feeValue: string;
      minFee?: string;
      maxFee?: string;
      endpoints?: Record<string, any>;
    }
  ): Promise<ProductProvider> {
    // Validate product and provider
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw ErrorResponse.notFound('Product not found');
    }

    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1);

    if (!provider) {
      throw ErrorResponse.notFound('Provider not found');
    }

    // Check if configuration exists
    const [existingConfig] = await db
      .select()
      .from(productProviders)
      .where(
        and(
          eq(productProviders.productId, productId),
          eq(productProviders.providerId, providerId)
        )
      )
      .limit(1);

    if (existingConfig) {
      // Update existing configuration
      await db
        .update(productProviders)
        .set({
          ...config,
          updatedAt: new Date()
        })
        .where(eq(productProviders.id, existingConfig.id));

      return this.getProviderConfig(existingConfig.id);
    }

    // Create new configuration
    const configId = crypto.randomUUID();
    await db
      .insert(productProviders)
      .values({
        id: configId,
        productId,
        providerId,
        ...config
      });

    return this.getProviderConfig(configId);
  }

  /**
   * Get provider configuration
   */
  private static async getProviderConfig(id: string): Promise<ProductProvider> {
    const [config] = await db
      .select()
      .from(productProviders)
      .where(eq(productProviders.id, id))
      .limit(1);

    if (!config) {
      throw ErrorResponse.notFound('Provider configuration not found');
    }

    return config as ProductProvider;
  }

  /**
   * Toggle maintenance mode
   */
  static async toggleMaintenance(
    id: string,
    maintenance: {
      enabled: boolean;
      message?: string;
      endTime?: Date;
    }
  ): Promise<Product> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw ErrorResponse.notFound('Product not found');
    }

    await db
      .update(products)
      .set({
        maintenanceMode: maintenance.enabled,
        maintenanceMessage: maintenance.message,
        maintenanceStartTime: maintenance.enabled ? new Date() : null,
        maintenanceEndTime: maintenance.endTime || null,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    return this.getProduct(id);
  }

  /**
   * Get product
   */
  static async getProduct(id: string): Promise<Product> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw ErrorResponse.notFound('Product not found');
    }

    return product;
  }
}