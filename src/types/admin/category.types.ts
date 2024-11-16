// // src/types/admin/category.types.ts
// // import { ServiceStatus } from "../../db/schema/categories";

// export type CategoryStatus = 'active' | 'inactive' | 'maintenance' | 'deprecated';

// export interface Category {
//   id: string;
//   name: string;
//   code: string;
//   status: CategoryStatus;
//   description: string | null;
//   icon: string | null;
//   isEnabled: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface CreateCategoryDTO {
//   name: string;
//   code: string;
//   description?: string | null;
//   icon?: string | null;
// }

// export interface UpdateCategoryDTO {
//   name?: string;
//   description?: string | null;
//   icon?: string | null;
//   isEnabled?: boolean;
//   status?: CategoryStatus;
// }

// export interface CategoryListOptions {
//   page: number;
//   limit: number;
//   status?: CategoryStatus;
// }

// export interface CategoryListResponse {
//   categories: Category[];
//   meta: {
//     total: number;
//     pages: number;
//   };
// }


// src/types/admin/category.types.ts
export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  isEnabled: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithProducts extends Category {
  productsCount: number;
  activeProducts: number;
}

export interface CategoryListQueryParams {
  page?: number;
  limit?: number;
  isEnabled?: boolean;
  search?: string;
  sortBy?: 'name' | 'code' | 'displayOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCategoryDto {
  name: string;
  code: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  displayOrder?: number;
  isEnabled?: boolean;
}

export interface CategoryListResponse {
  categories: CategoryWithProducts[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface CategoryProductsResponse {
  products: {
    id: string;
    name: string;
    code: string;
    isEnabled: boolean;
    maintenanceMode: boolean;
    displayOrder: number;
    createdAt: Date;
  }[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface CategoryRules {
  minimumAmount?: number;
  maximumAmount?: number;
  allowedProviders?: string[];
  requiredFields?: string[];
  validationRules?: Record<string, any>;
}