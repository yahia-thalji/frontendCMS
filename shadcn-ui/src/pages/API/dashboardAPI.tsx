import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Item } from './ItemsAPI';
import { Invoice } from './InvoicesAPI';
import { Shipment } from './ShippingAPI';

export interface DashboardStats {
  totalItems: number;
  totalSuppliers: number;
  totalInvoices: number;
  activeShipments: number;
  totalInvoiceAmount: number;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/* -------------------------------------------------------------------------- */
/*                         GET Dashboard Stats                               */
/* -------------------------------------------------------------------------- */
export const useGetDashboardStats = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/dashboard/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل إحصائيات لوحة التحكم: ${res.status} ${res.statusText}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: (error: Error) => {
        toast.error(error.message || 'حدث خطأ أثناء تحميل إحصائيات لوحة التحكم');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Low Stock Items                               */
/* -------------------------------------------------------------------------- */
export const useGetLowStockItems = () => {
  return useQuery<Item[], Error>({
    queryKey: ['dashboard', 'low-stock-items'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/dashboard/low-stock-items`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الأصناف منخفضة المخزون: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل الأصناف منخفضة المخزون');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Recent Invoices                               */
/* -------------------------------------------------------------------------- */
export const useGetRecentInvoices = () => {
  return useQuery<Invoice[], Error>({
    queryKey: ['dashboard', 'recent-invoices'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/dashboard/recent-invoices`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل أحدث الفواتير: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل أحدث الفواتير');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Active Shipments                              */
/* -------------------------------------------------------------------------- */
export const useGetActiveShipments = () => {
  return useQuery<Shipment[], Error>({
    queryKey: ['dashboard', 'active-shipments'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/dashboard/active-shipments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل الشحنات النشطة: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل الشحنات النشطة');
      },
    },
  });
};