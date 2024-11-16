// src/types/user/amtCard.types
export interface Card {
  id: string;
  userId: string;
  cardNumber: string;
  cardHolderName: string;
  last4Digits: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  isDefault: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface AddCardInput {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  setAsDefault?: boolean;
}
