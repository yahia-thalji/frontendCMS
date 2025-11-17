import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export interface Location {
  id: number;
  number: string;
  name: string;
  type: string;
  address?: string;
  capacity: number;
  currentUsage: number;
  createdAt: string;
  updatedAt: string;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/* -------------------------------------------------------------------------- */
/*                         GET All Locations                                 */
/* -------------------------------------------------------------------------- */
export const useGetAllLocations = () => {
  return useQuery<Location[], Error>({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/locations/getAll`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل المواقع: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل المواقع');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Location by ID                                 */
/* -------------------------------------------------------------------------- */
export const useGetLocationById = (id: number) => {
  return useQuery<Location, Error>({
    queryKey: ['location', id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/locations/getById/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الموقع: ${res.status}`);
      }

      return res.json();
    },

    enabled: !!id,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل الموقع');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         ADD Location                                       */
/* -------------------------------------------------------------------------- */
export const useAddLocation = () => {
  const queryClient = useQueryClient();

  return useMutation<Location, Error, Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (locationData) => {
      const res = await fetch(`${BASE}/locations/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في إضافة الموقع';

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
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('تمت إضافة الموقع بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الموقع');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         UPDATE Location                                    */
/* -------------------------------------------------------------------------- */
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Location,
    Error,
    { id: number; data: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${BASE}/locations/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const fallbackError = 'فشل في تحديث الموقع';

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
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('تم تحديث الموقع بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث الموقع');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         DELETE Location                                    */
/* -------------------------------------------------------------------------- */
export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation<Location, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/locations/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || 'فشل في حذف الموقع');
        } catch (_) {
          throw new Error(`خطأ في الخادم: ${res.status}`);
        }
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('تم حذف الموقع بنجاح');
    },

    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف الموقع');
    },
  });
};