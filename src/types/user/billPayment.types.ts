// src/types/user/billPayment.types.ts
export interface AirtimeRechargeInput {
  phoneNumber: string;
  amount: number;
  productId: string;
  providerId: string;
  saveRecipient?: boolean;
  recipientName?: string;
}

export interface DataBundleInput {
  phoneNumber: string;
  dataBundleId: string;
  productId: string;
  providerId: string;
  saveRecipient?: boolean;
  recipientName?: string;
}

export interface ElectricityPaymentInput {
  meterNumber: string;
  amount: number;
  productId: string;
  providerId: string;
  discoId: string;
  vendType: 'prepaid' | 'postpaid';
  saveRecipient?: boolean;
  recipientName?: string;
}

export interface CableTvPaymentInput {
  smartCardNumber: string;
  packageId: string;
  productId: string;
  providerId: string;
  saveRecipient?: boolean;
  recipientName?: string;
  addonCode?: string; // Optional addon service
}

export interface InternetPaymentInput {
  accountNumber: string;
  bundleId: string;
  productId: string;
  providerId: string;
  saveRecipient?: boolean;
  recipientName?: string;
}