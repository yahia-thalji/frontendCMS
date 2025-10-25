import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Users, 
  FileText, 
  Truck, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Cloud,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Item, Supplier, Invoice, Shipment } from '@/types';
import { ItemsStorage, SuppliersStorage, InvoicesStorage, ShipmentsStorage } from '@/lib/localStorage';
import { 
  CloudItemsStorage, 
  CloudSuppliersStorage, 
  CloudInvoicesStorage, 
  CloudShipmentsStorage 
} from '@/lib/cloudStorage';

interface DashboardProps {
  isCloudMode: boolean;
}

export default function Dashboard({ isCloudMode }: DashboardProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // دالة مساعدة لتنسيق الأرقام بأمان
  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

  // تحميل البيانات
  const loadData = async () => {
    setLoading(true);
    try {
      if (isCloudMode && isOnline) {
        // تحميل من السحابة
        const [itemsData, suppliersData, invoicesData, shipmentsData] = await Promise.all([
          CloudItemsStorage.getAll(),
          CloudSuppliersStorage.getAll(),
          CloudInvoicesStorage.getAll(),
          CloudShipmentsStorage.getAll()
        ]);

        setItems(itemsData);
        setSuppliers(suppliersData);
        setInvoices(invoicesData);
        setShipments(shipmentsData);
      } else {
        // تحميل من التخزين المحلي
        setItems(ItemsStorage.getAll());
        setSuppliers(SuppliersStorage.getAll());
        setInvoices(InvoicesStorage.getAll());
        setShipments(ShipmentsStorage.getAll());
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      // fallback إلى التخزين المحلي في حالة الخطأ
      setItems(ItemsStorage.getAll());
      setSuppliers(SuppliersStorage.getAll());
      setInvoices(InvoicesStorage.getAll());
      setShipments(ShipmentsStorage.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // إعداد المراقبة المباشرة للبيانات السحابية
    if (isCloudMode && isOnline) {
      const unsubscribeItems = CloudItemsStorage.onSnapshot(setItems);
      const unsubscribeSuppliers = CloudSuppliersStorage.onSnapshot(setSuppliers);
      const unsubscribeInvoices = CloudInvoicesStorage.onSnapshot(setInvoices);
      const unsubscribeShipments = CloudShipmentsStorage.onSnapshot(setShipments);

      return () => {
        unsubscribeItems();
        unsubscribeSuppliers();
        unsubscribeInvoices();
        unsubscribeShipments();
      };
    }
  }, [isCloudMode, isOnline]);

  // حساب الإحصائيات
  const totalItems = items.length;
  const totalSuppliers = suppliers.length;
  const totalInvoices = invoices.length;
  const totalShipments = shipments.length;

  const lowStockItems = items.filter(item => (item?.quantity || 0) < 20);
  const pendingInvoices = invoices.filter(invoice => invoice?.status === 'pending');
  const inTransitShipments = shipments.filter(shipment => shipment?.status === 'in_transit');

  const totalInventoryValue = items.reduce((sum, item) => 
    sum + ((item?.price || 0) * (item?.quantity || 0)), 0
  );

  const totalInvoicesValue = invoices.reduce((sum, invoice) => 
    sum + (invoice?.totalAmount || 0), 0
  );

  const recentItems = items.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s?.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      pending: { label: 'معلق', variant: 'outline' },
      paid: { label: 'مدفوع', variant: 'default' },
      overdue: { label: 'متأخر', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع مؤشر الحالة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-2">نظرة عامة على جميع العمليات والإحصائيات</p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          {isCloudMode && (
            <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center">
              {isOnline ? <Wifi className="h-3 w-3 ml-1" /> : <WifiOff className="h-3 w-3 ml-1" />}
              {isOnline ? 'متصل' : 'غير متصل'}
            </Badge>
          )}
          
          <Badge variant="outline" className="flex items-center">
            {isCloudMode ? <Cloud className="h-3 w-3 ml-1" /> : <Package className="h-3 w-3 ml-1" />}
            {isCloudMode ? 'نظام سحابي' : 'نظام محلي'}
          </Badge>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-600">
              قيمة: {safeToLocaleString(totalInventoryValue)} ريال
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-gray-600">مورد نشط</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-gray-600">
              قيمة: {safeToLocaleString(totalInvoicesValue)} ريال
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشحنات</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShipments}</div>
            <p className="text-xs text-gray-600">{inTransitShipments.length} في الطريق</p>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات والإشعارات */}
      {(lowStockItems.length > 0 || pendingInvoices.length > 0 || inTransitShipments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lowStockItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 ml-2" />
                  مخزون منخفض
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
                <p className="text-xs text-gray-600">صنف يحتاج تجديد</p>
              </CardContent>
            </Card>
          )}
          
          {pendingInvoices.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center text-yellow-600">
                  <FileText className="h-4 w-4 ml-2" />
                  فواتير معلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingInvoices.length}</div>
                <p className="text-xs text-gray-600">فاتورة تحتاج متابعة</p>
              </CardContent>
            </Card>
          )}
          
          {inTransitShipments.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center text-blue-600">
                  <Truck className="h-4 w-4 ml-2" />
                  شحنات في الطريق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{inTransitShipments.length}</div>
                <p className="text-xs text-gray-600">شحنة متوقعة الوصول</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* الجداول */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أحدث الأصناف */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 ml-2" />
              أحدث الأصناف
            </CardTitle>
            <CardDescription>آخر الأصناف المضافة إلى النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الصنف</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentItems.map((item) => (
                    <TableRow key={item?.id || Math.random()}>
                      <TableCell className="font-medium">{item?.name || 'غير محدد'}</TableCell>
                      <TableCell>{getSupplierName(item?.supplierId || '')}</TableCell>
                      <TableCell>{item?.quantity || 0}</TableCell>
                      <TableCell>{safeToLocaleString(item?.price)} ريال</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد أصناف مضافة بعد
              </div>
            )}
          </CardContent>
        </Card>

        {/* أحدث الفواتير */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 ml-2" />
              أحدث الفواتير
            </CardTitle>
            <CardDescription>آخر الفواتير المضافة إلى النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice?.id || Math.random()}>
                      <TableCell className="font-medium">{invoice?.invoiceNumber || 'غير محدد'}</TableCell>
                      <TableCell>{getSupplierName(invoice?.supplierId || '')}</TableCell>
                      <TableCell>{safeToLocaleString(invoice?.totalAmount)} ريال</TableCell>
                      <TableCell>{getStatusBadge(invoice?.status || 'draft')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد فواتير مضافة بعد
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* روابط سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 ml-2" />
            إجراءات سريعة
          </CardTitle>
          <CardDescription>الإجراءات الأكثر استخداماً في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Package className="h-6 w-6 mb-2" />
              إضافة صنف جديد
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              إضافة مورد جديد
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <FileText className="h-6 w-6 mb-2" />
              إنشاء فاتورة
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              عرض التقارير
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}