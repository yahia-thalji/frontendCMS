import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
// import type { Currency } from '../types/currency';
export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://backendcms-production-e082.up.railway.app/api';

/* -------------------------------------------------------------------------- */
/*                         GET All Currencies                                 */
/* -------------------------------------------------------------------------- */
export const useGetAllCurrencies = () => {
  return useQuery<Currency[], Error>({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/currencies/getAll`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل العملات: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل العملات');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Currency by ID                                 */
/* -------------------------------------------------------------------------- */
export const useGetCurrencyById = (id: number) => {
  return useQuery<Currency, Error>({
    queryKey: ['currency', id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/currencies/getById/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل العملة: ${res.status}`);
      }

      return res.json();
    },

    enabled: !!id,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل العملة');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         ADD Currency                                       */
/* -------------------------------------------------------------------------- */
export const useAddCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation<Currency, Error, Omit<Currency, 'id'>>({
    mutationFn: async (currencyData) => {
      const res = await fetch(`${BASE}/currencies/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currencyData),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في إضافة العملة';

        try {
          const errorData = await res.json();

          if (errorData?.errors) {
            throw new Error(
              Object.values(errorData.errors)
                .flat()
                .join(', ')
            );
          }

          throw new Error(errorData.message || fallbackError);
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('تمت إضافة العملة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة العملة');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE Currency                                    */
/* -------------------------------------------------------------------------- */
export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Currency,
    Error,
    { id: number; data: Partial<Omit<Currency, 'id'>> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${BASE}/currencies/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في تحديث العملة';

        try {
          const errorData = await res.json();

          if (errorData.errors) {
            throw new Error(
              Object.values(errorData.errors)
                .flat()
                .join(', ')
            );
          }

          throw new Error(errorData.message || fallbackError);
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('تم تحديث العملة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث العملة');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         DELETE Currency                                    */
/* -------------------------------------------------------------------------- */
export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation<Currency, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/currencies/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'فشل في حذف العملة');
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('تم حذف العملة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف العملة');
    },
  });
};
