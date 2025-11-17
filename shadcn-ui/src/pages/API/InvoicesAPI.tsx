import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export interface InvoiceItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: number;
  number: string;
  supplierId: string;
  issueDate: string;
  dueDate?: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  currencyId?: number;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/* -------------------------------------------------------------------------- */
/*                         GET All Invoices                                  */
/* -------------------------------------------------------------------------- */
export const useGetAllInvoices = () => {
  return useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/invoices/getAll`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الفواتير: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل الفواتير');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Invoice by ID                                 */
/* -------------------------------------------------------------------------- */
export const useGetInvoiceById = (id: number) => {
  return useQuery<Invoice, Error>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/invoices/getById/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الفاتورة: ${res.status}`);
      }

      return res.json();
    },

    enabled: !!id,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل الفاتورة');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         ADD Invoice                                       */
/* -------------------------------------------------------------------------- */
export const useAddInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (invoiceData) => {
      const res = await fetch(`${BASE}/invoices/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في إضافة الفاتورة';

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
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تمت إضافة الفاتورة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الفاتورة');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE Invoice                                    */
/* -------------------------------------------------------------------------- */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Invoice,
    Error,
    { id: number; data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${BASE}/invoices/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في تحديث الفاتورة';

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
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم تحديث الفاتورة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث الفاتورة');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         DELETE Invoice                                    */
/* -------------------------------------------------------------------------- */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/invoices/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'فشل في حذف الفاتورة');
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم حذف الفاتورة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف الفاتورة');
    },
  });
};