// src/services/admin/category.service.ts
import { and, eq, like, or, desc, asc, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { categories, products } from '../../db/schema';
import { ErrorResponse } from '../../utilities/error';
import type { 
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryListQueryParams,
  CategoryListResponse,
  CategoryProductsResponse
} from '../../types/admin/category.types';
import { CategoryCodes } from '../../db/schema/categories';

export class CategoryService {
  private static getOrderByClause(sortBy: string, sortOrder: 'asc' | 'desc') {
    const column = this.getColumnForSort(sortBy);
    return sortOrder === 'desc' ? desc(column) : asc(column);
  }
  
  private static getColumnForSort(sortBy: string) {
    const columns: Record<string, any> = {
    name: categories.name,
    code: categories.code,
    };
    return columns[sortBy] || categories.createdAt;
  }

  /**
   * List categories with products count
   */
  static async listCategories(
    params: CategoryListQueryParams
  ): Promise<CategoryListResponse> {
    const {
      page = 1,
      limit = 10,
      isEnabled,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    // Only add isEnabled condition if it's a boolean
    if (typeof isEnabled === 'boolean') {
      conditions.push(eq(categories.isEnabled, isEnabled));
    }

    // Only add search condition if search string is not empty
    if (search && search.trim() !== '') {
      conditions.push(
        or(
          like(categories.name, `%${search}%`),
          like(categories.code, `%${search}%`),
          sql`${categories.description} LIKE ${`%${search}%`}`
        )
      );
    }

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(distinct ${categories.id}) as unsigned)`
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .where(and(...conditions));

    // Get categories with product counts
    const results = await db
      .select({
        id: categories.id,
        name: categories.name,
        code: categories.code,
        description: categories.description,
        icon: categories.icon,
        isEnabled: categories.isEnabled,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productsCount: sql<number>`cast(count(distinct ${products.id}) as unsigned)`,
        activeProducts: sql<number>`cast(sum(case when ${products.isEnabled} = true then 1 else 0 end) as unsigned)`
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .where(and(...conditions))
      .groupBy(
        categories.id,
        categories.name,
        categories.code,
        categories.description,
        categories.icon,
        categories.isEnabled,
        categories.displayOrder,
        categories.createdAt,
        categories.updatedAt
      )
      .orderBy(
        sortBy === 'name' 
          ? sortOrder === 'desc' 
            ? desc(categories.name)
            : asc(categories.name)
          : sortOrder === 'desc'
            ? desc(categories.displayOrder)
            : asc(categories.displayOrder)
      )
      .limit(limit)
      .offset(offset);

    return {
      categories: results.map(result => ({
        ...result,
        productsCount: Number(result.productsCount || 0),
        activeProducts: Number(result.activeProducts || 0)
      })),
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit
      }
    };
  }

  /**
   * Create category
   */
  static async createCategory(data: CreateCategoryDto): Promise<Category> {
    // Check if category with same code exists
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.code, data.code.toUpperCase() as CategoryCodes))
      .limit(1);

    if (existingCategory) {
      throw ErrorResponse.conflict('Category with this code already exists');
    }

    // Insert category 
    await db
      .insert(categories)
      .values({
        name: data.name,
        code: data.code.toUpperCase() as CategoryCodes,
        description: data.description,
        displayOrder: data.displayOrder || 0,
        isEnabled: true
      });

    // Get the created category
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.code, data.code.toUpperCase() as CategoryCodes))
      .limit(1);

    if (!category) {
      throw ErrorResponse.internal('Failed to create category');
    }

    return category;
  }

  /**
   * Update category
   */
  static async updateCategory(
    id: string,
    data: UpdateCategoryDto
  ): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw ErrorResponse.notFound('Category not found');
    }

    // Update category
    await db
      .update(categories)
      .set({
        ...data
      })
      .where(eq(categories.id, id));

    // Get updated category
    const [updatedCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!updatedCategory) {
      throw ErrorResponse.internal('Failed to retrieve updated category');
    }

    return updatedCategory;
  }

  /**
   * Toggle category status
   */
  static async toggleStatus(id: string): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw ErrorResponse.notFound('Category not found');
    }

    await db
      .update(categories)
      .set({
        isEnabled: !category.isEnabled
      })
      .where(eq(categories.id, id));

    return this.getCategory(id);
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(
    id: string,
    displayOrder: number
  ): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw ErrorResponse.notFound('Category not found');
    }

    await db
      .update(categories)
      .set({
        displayOrder,
      })
      .where(eq(categories.id, id));

    return this.getCategory(id);
  }

  /**
   * Get category details
   */
  static async getCategory(id: string): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw ErrorResponse.notFound('Category not found');
    }

    return category;
  }

  /**
   * List category products
   */
  static async listCategoryProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<CategoryProductsResponse> {
    const offset = (page - 1) * limit;

    // Check if category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw ErrorResponse.notFound('Category not found');
    }

    // Get total count
    const [countResult] = await db
      .select({
        count: sql<number>`cast(count(*) as unsigned)`
      })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    // Get products
    const categoryProducts = await db
      .select({
        id: products.id,
        name: products.name,
        code: products.code,
        isEnabled: products.isEnabled,
        maintenanceMode: products.maintenanceMode,
        displayOrder: products.displayOrder,
        createdAt: products.createdAt
      })
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      products: categoryProducts,
      meta: {
        total: Number(countResult?.count || 0),
        pages: Math.ceil(Number(countResult?.count || 0) / limit),
        page,
        limit
      }
    };
  }

  static async deleteCategory(id: string): Promise<void> {
    // Check if category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw ErrorResponse.notFound("Category not found");
    }

    // Check if category has service providers
    const providers = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id))
      .limit(1);

    if (providers[0]) {
      throw ErrorResponse.badRequest(
        "Cannot delete category with linked product"
      );
    }

    // Delete category
    await db.delete(categories).where(eq(categories.id, id));
  }
}