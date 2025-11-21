import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Item } from './ItemsAPI';
import { Supplier } from './SuppliersAPI';
import { Invoice } from './InvoicesAPI';
import { Shipment } from './ShippingAPI';

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  categories: Record<string, number>;
  lowStockItemsList: Array<{
    id: number;
    name: string;
    number: string;
    quantity: number;
    unit: string;
    supplierName: string;
    locationName: string;
  }>;
}

export interface SuppliersReport {
  totalSuppliers: number;
  activeSuppliers: number;
  topSuppliers: Array<{
    id: number;
    name: string;
    itemsCount: number;
    totalValue: number;
    contactPerson?: string;
    email?: string;
    phone?: string;
  }>;
}

export interface CostsReport {
  totalPurchases: number;
  totalShipping: number;
  totalCustoms: number;
  totalCosts: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    year: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface ShippingReport {
  totalShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  customsShipments: number;
  arrivedShipments: number;
  averageShippingCost: number;
  totalShippingCost: number;
  statusBreakdown: Record<string, number>;
  recentShipments: Array<{
    id: number;
    containerNumber: string;
    billOfLading: string;
    status: string;
    departureDate: string;
    arrivalDate?: string;
    supplierName: string;
    shippingCost: number;
  }>;
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://backendcms-production-e082.up.railway.app/api';

/* -------------------------------------------------------------------------- */
/*                         GET Inventory Report                              */
/* -------------------------------------------------------------------------- */
export const useGetInventoryReport = (period?: string) => {
  return useQuery<InventoryReport, Error>({
    queryKey: ['reports', 'inventory', period],
    queryFn: async () => {
      const url = period ? 
        `${BASE}/reports/inventory?period=${period}` : 
        `${BASE}/reports/inventory`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل تقرير المخزون: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل تقرير المخزون');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Suppliers Report                              */
/* -------------------------------------------------------------------------- */
export const useGetSuppliersReport = () => {
  return useQuery<SuppliersReport, Error>({
    queryKey: ['reports', 'suppliers'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/reports/suppliers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل تقرير الموردين: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل تقرير الموردين');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Costs Report                                  */
/* -------------------------------------------------------------------------- */
export const useGetCostsReport = (period?: string) => {
  return useQuery<CostsReport, Error>({
    queryKey: ['reports', 'costs', period],
    queryFn: async () => {
      const url = period ? 
        `${BASE}/reports/costs?period=${period}` : 
        `${BASE}/reports/costs`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل تحليل التكاليف: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل تحليل التكاليف');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         GET Shipping Report                               */
/* -------------------------------------------------------------------------- */
export const useGetShippingReport = () => {
  return useQuery<ShippingReport, Error>({
    queryKey: ['reports', 'shipping'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/reports/shipping`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`فشل في تحميل تقرير الشحن: ${res.status}`);
      }

      return res.json();
    },

    retry: 2,
    refetchOnWindowFocus: false,

    meta: {
      onError: () => {
        toast.error('حدث خطأ أثناء تحميل تقرير الشحن');
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         EXPORT Report                                     */
/* -------------------------------------------------------------------------- */
export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({ reportType, format = 'json' }: { reportType: string; format?: string }) => {
      const res = await fetch(`${BASE}/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, format }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'فشل في تصدير التقرير');
      }

      if (format === 'json') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      return res.json();
    },

    onSuccess: () => {
      toast.success('تم تصدير التقرير بنجاح');
    },

    onError: (error: Error) => {
      toast.error(error.message || 'حدث خطأ أثناء تصدير التقرير');
    },
  });
};