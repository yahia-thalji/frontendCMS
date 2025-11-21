import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export interface ShipmentItem {
  itemId: string;
  quantity: number;
  weight?: number;
  volume?: number;
}

export interface Shipment {
  id: number;
  containerNumber: string;
  billOfLading: string;
  supplierId: string;
  departureDate: string;
  arrivalDate?: string;
  status: 'in_transit' | 'arrived' | 'customs' | 'delivered';
  shippingCost: number;
  customsFees: number;
  insurance?: number;
  currencyId?: number;
  items: ShipmentItem[];
  createdAt: string;
  updatedAt: string;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://backendcms-production-e082.up.railway.app/api';

/* -------------------------------------------------------------------------- */
/*                         GET All Shipments                                 */
/* -------------------------------------------------------------------------- */
export const useGetAllShipments = () => {
  return useQuery<Shipment[], Error>({
    queryKey: ['shipments'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/shipments/getAll`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الشحنات: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل الشحنات');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Shipment by ID                                 */
/* -------------------------------------------------------------------------- */
export const useGetShipmentById = (id: number) => {
  return useQuery<Shipment, Error>({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/shipments/getById/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الشحنة: ${res.status}`);
      }

      return res.json();
    },

    enabled: !!id,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل الشحنة');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         ADD Shipment                                       */
/* -------------------------------------------------------------------------- */
export const useAddShipment = () => {
  const queryClient = useQueryClient();

  return useMutation<Shipment, Error, Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (shipmentData) => {
      const res = await fetch(`${BASE}/shipments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في إضافة الشحنة';

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
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('تمت إضافة الشحنة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الشحنة');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE Shipment                                    */
/* -------------------------------------------------------------------------- */
export const useUpdateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Shipment,
    Error,
    { id: number; data: Partial<Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${BASE}/shipments/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في تحديث الشحنة';

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
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('تم تحديث الشحنة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث الشحنة');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         DELETE Shipment                                    */
/* -------------------------------------------------------------------------- */
export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation<Shipment, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/shipments/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'فشل في حذف الشحنة');
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('تم حذف الشحنة بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف الشحنة');
    },
  });
};