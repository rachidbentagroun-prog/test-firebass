// utils/currency.ts
// Simple currency conversion utility using exchangerate.host

export type Currency = 'USD' | 'EUR' | 'MAD' | 'SAR' | 'GBP' | 'CAD' | 'JPY' | 'CNY' | 'INR' | 'BRL' | 'AUD' | 'EGP' | 'TRY';

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  MAD: 'د.م.',
  SAR: 'ر.س',
  GBP: '£',
  CAD: 'C$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  AUD: 'A$',
  EGP: 'ج.م',
  TRY: '₺',
};

export async function fetchExchangeRates(base: Currency = 'USD'): Promise<Record<Currency, number>> {
  const res = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
  const data = await res.json();
  return data.rates;
}

export function detectUserCurrency(): Currency {
  // Try to detect from browser locale
  const locale = navigator.language || 'en-US';
  const region = locale.split('-')[1] || 'US';
  switch (region.toUpperCase()) {
    case 'MA': return 'MAD';
    case 'SA': return 'SAR';
    case 'FR': return 'EUR';
    case 'GB': return 'GBP';
    case 'CA': return 'CAD';
    case 'JP': return 'JPY';
    case 'CN': return 'CNY';
    case 'IN': return 'INR';
    case 'BR': return 'BRL';
    case 'AU': return 'AUD';
    case 'EG': return 'EGP';
    case 'TR': return 'TRY';
    case 'US':
    default: return 'USD';
  }
}

export function formatCurrency(amount: number, currency: Currency): string {
  return `${currencySymbols[currency] || ''}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
