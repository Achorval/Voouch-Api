// src/types/admin/serviceProvider.types.ts
export interface ServiceProvider {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  logo: string | null;
  isAirtimeEnabled: boolean;
  isDataEnabled: boolean;
  isElectricityEnabled: boolean;
  isCableTvEnabled: boolean;
  isInternetEnabled: boolean;
  isEnabled: boolean;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceProviderDTO {
  name: string;
  code: string;
  categoryId: string;
  logo?: string | null;
  isAirtimeEnabled?: boolean;
  isDataEnabled?: boolean;
  isElectricityEnabled?: boolean;
  isCableTvEnabled?: boolean;
  isInternetEnabled?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateServiceProviderDTO {
  name?: string;
  categoryId?: string;
  logo?: string | null;
  isAirtimeEnabled?: boolean;
  isDataEnabled?: boolean;
  isElectricityEnabled?: boolean;
  isCableTvEnabled?: boolean;
  isInternetEnabled?: boolean;
  isEnabled?: boolean;
  metadata?: Record<string, any>;
}

export interface ServiceProviderListOptions {
  page: number;
  limit: number;
  categoryId?: string;
  isEnabled?: boolean;
}

export interface ServiceProviderListResponse {
  serviceProviders: ServiceProvider[];
  meta: {
    total: number;
    pages: number;
  };
}