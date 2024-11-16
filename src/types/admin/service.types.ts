// src/types/admin/service.types.ts
export interface Provider {
  id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  isEnabled: boolean;
  isLive: boolean;
  baseUrl: string;
  testBaseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  isEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string | null;
  maintenanceStartTime?: Date | null;
  maintenanceEndTime?: Date | null;
  minimumAmount?: string;
  maximumAmount?: string;
  displayOrder: number;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductProvider {
  id: string;
  productId: string;
  providerId: string;
  providerProductCode: string;
  priority: number;
  isEnabled: boolean;
  isDefault: boolean;
  feeType: 'flat' | 'percentage';
  feeValue: string;
  minFee?: string;
  maxFee?: string;
  endpoints?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  isEnabled: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderListQueryParams {
  page?: number;
  limit?: number;
  isEnabled?: boolean;
  isLive?: boolean;
  search?: string;
}

export interface ProductListQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  isEnabled?: boolean;
  maintenanceMode?: boolean;
  search?: string;
}

export interface CreateProviderDto {
  name: string;
  code: string;
  description?: string;
  baseUrl: string;
  testBaseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  isLive: boolean;
}

export interface UpdateProviderDto {
  name?: string;
  description?: string;
  baseUrl?: string;
  testBaseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  isLive?: boolean;
  isEnabled?: boolean;
}

export interface CreateProductDto {
  categoryId: string;
  name: string;
  code: string;
  description?: string | null;
  minimumAmount?: string;
  maximumAmount?: string;
  displayOrder?: number;
  metadata?: Record<string, any> | null;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  minimumAmount?: string;
  maximumAmount?: string;
  displayOrder?: number;
  isEnabled?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceStartTime?: Date;
  maintenanceEndTime?: Date;
  metadata?: Record<string, any>;
}

export interface ProviderListResponse {
  providers: Provider[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface ProductListResponse {
  products: Product[];
  meta: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}