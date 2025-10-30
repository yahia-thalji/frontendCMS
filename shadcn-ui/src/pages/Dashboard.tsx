import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, FileText, Ship, TrendingUp, AlertCircle } from 'lucide-react';
import { Item, Supplier, Invoice, Shipment } from '@/types';
import { SupabaseItemsStorage, SupabaseSuppliersStorage, SupabaseInvoicesStorage, SupabaseShipmentsStorage } from '@/lib/supabaseStorage';

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [itemsData, suppliersData, invoicesData, shipmentsData] = await Promise.all([
          SupabaseItemsStorage.getAll(),
          SupabaseSuppliersStorage.getAll(),
          SupabaseInvoicesStorage.getAll(),
          SupabaseShipmentsStorage.getAll()
        ]);
        setItems(itemsData);
        setSuppliers(suppliersData);
        setInvoices(invoicesData);
        setShipments(shipmentsData);
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribeItems = SupabaseItemsStorage.subscribe(setItems);
    const unsubscribeSuppliers = SupabaseSuppliersStorage.subscribe(setSuppliers);
    const unsubscribeInvoices = SupabaseInvoicesStorage.subscribe(setInvoices);
    const unsubscribeShipments = SupabaseShipmentsStorage.subscribe(setShipments);

    return () => {
      unsubscribeItems();
      unsubscribeSuppliers();
      unsubscribeInvoices();
      unsubscribeShipments();
    };
  }, []);

  const lowStockItems = items.filter(item => (item?.quantity || 0) < 20);
  const activeShipments = shipments.filter(ship => ship?.status === 'in_transit');
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv?.totalAmount || 0), 0);

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

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">نظرة عامة على النظام</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-gray-600 mt-1">صنف مسجل</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-gray-600 mt-1">مورد نشط</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-gray-600 mt-1">فاتورة</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشحنات النشطة</CardTitle>
            <Ship className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShipments.length}</div>
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
              {totalInvoiceAmount.toLocaleString('ar')} ريال
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
                <div key={item?.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-red-200 gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item?.name || 'غير محدد'}</p>
                    <p className="text-sm text-gray-500">{item?.itemNumber || 'غير محدد'}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500">الكمية المتبقية</p>
                    <p className="text-lg font-bold text-red-600">
                      {item?.quantity || 0} {item?.unit || ''}
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
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice?.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{invoice?.invoiceNumber || 'غير محدد'}</p>
                    <p className="text-xs text-gray-500">{invoice?.issueDate || 'غير محدد'}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">
                    {(invoice?.totalAmount || 0).toLocaleString('ar')} ريال
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
                <div key={shipment?.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{shipment?.shipmentNumber || 'غير محدد'}</p>
                    <p className="text-xs text-gray-500">
                      {shipment?.origin || 'غير محدد'} → {shipment?.destination || 'غير محدد'}
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