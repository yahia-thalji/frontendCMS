import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export interface Item {
  id: number;
  number: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string;
  profitMargin?: number;
  profitAmount?: number;
  costPrice?: number;
  currencyId?: number;
  locationId?: number;
  supplierId?: number;
  createdAt: string;
  updatedAt: string;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/* -------------------------------------------------------------------------- */
/*                         GET All Items                                     */
/* -------------------------------------------------------------------------- */
export const useGetAllItems = () => {
  return useQuery<Item[], Error>({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/items/getAll`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الأصناف: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل الأصناف');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Item by ID                                    */
/* -------------------------------------------------------------------------- */
export const useGetItemById = (id: number) => {
  return useQuery<Item, Error>({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/items/getById/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الصنف: ${res.status}`);
      }

      return res.json();
    },

    enabled: !!id,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل الصنف');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         ADD Item                                          */
/* -------------------------------------------------------------------------- */
export const useAddItem = () => {
  const queryClient = useQueryClient();

  return useMutation<Item, Error, Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (itemData) => {
      const res = await fetch(`${BASE}/items/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في إضافة الصنف';

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
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('تمت إضافة الصنف بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الصنف');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE Item                                       */
/* -------------------------------------------------------------------------- */
export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Item,
    Error,
    { id: number; data: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${BASE}/items/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في تحديث الصنف';

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
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('تم تحديث الصنف بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث الصنف');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         DELETE Item                                       */
/* -------------------------------------------------------------------------- */
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation<Item, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/items/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'فشل في حذف الصنف');
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('تم حذف الصنف بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف الصنف');
    },
  });
};