import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export interface Supplier {
  id: number;
  number: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/* -------------------------------------------------------------------------- */
/*                         GET All Suppliers                                 */
/* -------------------------------------------------------------------------- */
export const useGetAllSuppliers = () => {
  return useQuery<Supplier[], Error>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/suppliers/getAll`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الموردين: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل الموردين');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Supplier by ID                                 */
/* -------------------------------------------------------------------------- */
export const useGetSupplierById = (id: number) => {
  return useQuery<Supplier, Error>({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/suppliers/getById/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل المورد: ${res.status}`);
      }

      return res.json();
    },

    enabled: !!id,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل المورد');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         ADD Supplier                                       */
/* -------------------------------------------------------------------------- */
export const useAddSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<Supplier, Error, Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (supplierData) => {
      const res = await fetch(`${BASE}/suppliers/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في إضافة المورد';

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
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تمت إضافة المورد بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة المورد');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE Supplier                                    */
/* -------------------------------------------------------------------------- */
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Supplier,
    Error,
    { id: number; data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${BASE}/suppliers/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في تحديث المورد';

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
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تم تحديث المورد بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث المورد');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         DELETE Supplier                                    */
/* -------------------------------------------------------------------------- */
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<Supplier, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/suppliers/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'فشل في حذف المورد');
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تم حذف المورد بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف المورد');
    },
  });
};