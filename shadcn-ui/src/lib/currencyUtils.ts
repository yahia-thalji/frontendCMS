import { Currency } from '@/types';

/**
 * الحصول على العملة الأساسية من قائمة العملات
 */
export const getBaseCurrency = (currencies: Currency[]): Currency | null => {
  return currencies.find(c => c.isBaseCurrency) || null;
};

/**
 * تحويل مبلغ من عملة إلى العملة الأساسية
 */
export const convertToBaseCurrency = (
  amount: number,
  fromCurrencyId: string | undefined,
  currencies: Currency[]
): number => {
  if (!fromCurrencyId) return amount;
  
  const baseCurrency = getBaseCurrency(currencies);
  if (!baseCurrency) return amount;
  
  const fromCurrency = currencies.find(c => c.id === fromCurrencyId);
  if (!fromCurrency) return amount;
  
  // إذا كانت العملة المصدر هي العملة الأساسية، لا حاجة للتحويل
  if (fromCurrency.id === baseCurrency.id) return amount;
  
  // التحويل: المبلغ / سعر صرف العملة المصدر
  return amount / fromCurrency.exchangeRate;
};

/**
 * تحويل مبلغ من العملة الأساسية إلى عملة أخرى
 */
export const convertFromBaseCurrency = (
  amount: number,
  toCurrencyId: string | undefined,
  currencies: Currency[]
): number => {
  if (!toCurrencyId) return amount;
  
  const baseCurrency = getBaseCurrency(currencies);
  if (!baseCurrency) return amount;
  
  const toCurrency = currencies.find(c => c.id === toCurrencyId);
  if (!toCurrency) return amount;
  
  // إذا كانت العملة المستهدفة هي العملة الأساسية، لا حاجة للتحويل
  if (toCurrency.id === baseCurrency.id) return amount;
  
  // التحويل: المبلغ * سعر صرف العملة المستهدفة
  return amount * toCurrency.exchangeRate;
};

/**
 * تنسيق المبلغ مع رمز العملة الأساسية
 */
export const formatWithBaseCurrency = (
  amount: number,
  currencies: Currency[],
  locale: string = 'ar'
): string => {
  const baseCurrency = getBaseCurrency(currencies);
  const formattedAmount = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (baseCurrency) {
    return `${formattedAmount} ${baseCurrency.symbol}`;
  }
  
  return formattedAmount;
};

/**
 * الحصول على رمز العملة الأساسية
 */
export const getBaseCurrencySymbol = (currencies: Currency[]): string => {
  const baseCurrency = getBaseCurrency(currencies);
  return baseCurrency?.symbol || '';
};

/**
 * الحصول على اسم العملة الأساسية
 */
export const getBaseCurrencyName = (currencies: Currency[]): string => {
  const baseCurrency = getBaseCurrency(currencies);
  return baseCurrency?.name || 'غير محدد';
};

/**
 * التحقق من وجود عملة أساسية
 */
export const hasBaseCurrency = (currencies: Currency[]): boolean => {
  return currencies.some(c => c.isBaseCurrency);
};