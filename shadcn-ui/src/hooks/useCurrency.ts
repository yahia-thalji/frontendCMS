import { useState, useEffect } from 'react';
import { Currency } from '@/types';
import { SupabaseCurrenciesStorage } from '@/lib/supabaseStorage';
import { getBaseCurrency } from '@/lib/currencyUtils';

/**
 * Hook لإدارة العملات والعملة الأساسية
 */
export const useCurrency = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrencies = async () => {
      setLoading(true);
      try {
        const data = await SupabaseCurrenciesStorage.getAll();
        setCurrencies(data);
        setBaseCurrency(getBaseCurrency(data));
      } catch (error) {
        console.error('خطأ في تحميل العملات:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrencies();

    const unsubscribe = SupabaseCurrenciesStorage.subscribe((newCurrencies) => {
      setCurrencies(newCurrencies);
      setBaseCurrency(getBaseCurrency(newCurrencies));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    currencies,
    baseCurrency,
    loading
  };
};