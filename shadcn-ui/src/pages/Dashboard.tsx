import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, FileText, Ship, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useGetDashboardStats, useGetLowStockItems, useGetRecentInvoices, useGetActiveShipments } from '@/pages/API/dashboardAPI';
import { useGetAllCurrencies } from '@/pages/API/CurrenciesAPI'; 
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useGetDashboardStats();
  
  const { 
    data: lowStockItemsData, 
    isLoading: lowStockLoading 
  } = useGetLowStockItems();
  
  const { 
    data: recentInvoicesData 
  } = useGetRecentInvoices();
  
  const { 
    data: activeShipmentsData 
  } = useGetActiveShipments();
  
  const { 
    data: currenciesData 
  } = useGetAllCurrencies();

  const stats = statsData || {
    totalItems: 0,
    totalSuppliers: 0,
    totalInvoices: 0,
    activeShipments: 0,
    totalInvoiceAmount: 0
  };

  const lowStockItems = Array.isArray(lowStockItemsData) ? lowStockItemsData : [];
  const recentInvoices = Array.isArray(recentInvoicesData) ? recentInvoicesData : [];
  const activeShipments = Array.isArray(activeShipmentsData) ? activeShipmentsData : [];
  const currencies = Array.isArray(currenciesData) ? currenciesData : [];
  const baseCurrency = currencies.find(c => c.isBase);

  const loading = statsLoading || lowStockLoading;

  const formatPrice = (amount: number): string => {
    if (!baseCurrency) return amount.toString();
    return `${amount.toLocaleString('ar')} ${baseCurrency.symbol}`;
  };

  const handleRetry = () => {
    refetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">حدث خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">
              {statsError instanceof Error ? statsError.message : 'تعذر تحميل بيانات لوحة التحكم'}
            </p>
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">نظرة عامة على النظام</p>
        </div>
        <Button 
          variant="outline"
          onClick={handleRetry}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-gray-600 mt-1">صنف مسجل</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-gray-600 mt-1">مورد نشط</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-gray-600 mt-1">فاتورة</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشحنات النشطة</CardTitle>
            <Ship className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeShipments}</div>
            <p className="text-xs text-gray-600 mt-1">شحنة في الطريق</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <TrendingUp className="h-5 w-5 ml-2 text-green-600" />
              إجمالي قيمة الفواتير
            </CardTitle>
            <CardDescription className="text-sm">مجموع جميع الفواتير المسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-green-600">
              {formatPrice(stats.totalInvoiceAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <AlertCircle className="h-5 w-5 ml-2 text-red-600" />
              تنبيهات المخزون
            </CardTitle>
            <CardDescription className="text-sm">أصناف تحتاج إعادة طلب</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-red-600">
              {lowStockItems.length}
            </div>
            <p className="text-sm text-gray-600 mt-2">صنف أقل من 20 وحدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-red-700 text-lg md:text-xl">
              <AlertCircle className="h-5 w-5 ml-2" />
              أصناف منخفضة المخزون
            </CardTitle>
            <CardDescription className="text-sm">الأصناف التي تحتاج إعادة طلب</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-red-200 gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.number}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500">الكمية المتبقية</p>
                    <p className="text-lg font-bold text-red-600">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">آخر الفواتير</CardTitle>
            <CardDescription className="text-sm">أحدث 5 فواتير</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{invoice.number}</p>
                    <p className="text-xs text-gray-500">{invoice.issueDate}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">
                    {formatPrice(invoice.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">الشحنات النشطة</CardTitle>
            <CardDescription className="text-sm">شحنات في الطريق</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeShipments.slice(0, 5).map((shipment) => (
                <div key={shipment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{shipment.containerNumber}</p>
                    <p className="text-xs text-gray-500">
                      {shipment.departureDate} → {shipment.arrivalDate || 'غير محدد'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      في الطريق
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}