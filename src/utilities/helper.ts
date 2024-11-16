// src/utilities/helper.ts

/**
 * Format amount with currency
 */
export const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
    }).format(amount);
}

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: string): string => {
    const formats = {
        card: 'Card Payment',
        bank_transfer: 'Bank Transfer',
        wallet: 'Wallet',
        ussd: 'USSD'
    };
    return formats[method as keyof typeof formats] || method;
}    