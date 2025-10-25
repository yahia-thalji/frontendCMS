import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Users, MapPin, Truck, FileText, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { mockItems, mockSuppliers, mockLocations, mockShipments, mockInvoices } from '@/data/mockData';
import { ItemsStorage, SuppliersStorage, LocationsStorage, ShipmentsStorage, InvoicesStorage } from '@/lib/localStorage';

export default function Dashboard() {
  const [items, setItems] = useState(mockItems);
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [locations, setLocations] = useState(mockLocations);
  const [shipments, setShipments] = useState(mockShipments);
  const [invoices, setInvoices] = useState(mockInvoices);

  // تحميل البيانات من التخزين المحلي
  useEffect(() => {
    const storedItems = ItemsStorage.getAll();
    const storedSuppliers = SuppliersStorage.getAll();
    const storedLocations = LocationsStorage.getAll();
    const storedShipments = ShipmentsStorage.getAll();
    const storedInvoices = InvoicesStorage.getAll();

    if (storedItems.length > 0) setItems(storedItems);
    if (storedSuppliers.length > 0) setSuppliers(storedSuppliers);
    if (storedLocations.length > 0) setLocations(storedLocations);
    if (storedShipments.length > 0) setShipments(storedShipments);
    if (storedInvoices.length > 0) setInvoices(storedInvoices);
  }, []);

  // إحصائيات عامة
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.quantity < 20).length;
  const totalSuppliers = suppliers.length;
  const activeShipments = shipments.filter(s => s.status === 'in_transit').length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

  // إحصائيات المخزون
  const totalCapacity = locations.reduce((sum, location) => sum + location.capacity, 0);
  const totalUsed = locations.reduce((sum, location) => sum + location.currentStock, 0);
  const utilizationRate = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  // إحصائيات مالية
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  // الأنشطة الأخيرة
  const recentActivities = [
    ...items.slice(-3).map(item => ({
      type: 'item',
      description: `تم إضافة صنف جديد: ${item.name}`,
      time: item.createdAt,
      icon: Package
    })),
    ...suppliers.slice(-2).map(supplier => ({
      type: 'supplier',
      description: `تم إضافة مورد جديد: ${supplier.name}`,
      time: supplier.createdAt,
      icon: Users
    })),
    ...shipments.slice(-2).map(shipment => ({
      type: 'shipment',
      description: `شحنة جديدة: ${shipment.shipmentNumber}`,
      time: shipment.departureDate,
      icon: Truck
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2">نظرة عامة على نشاط نظام إدارة الاستيراد</p>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-600">
              {lowStockItems > 0 && (
                <span className="text-red-600">
                  {lowStockItems} صنف بمخزون منخفض
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين النشطين</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-gray-600">مورد مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشحنات النشطة</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShipments}</div>
            <p className="text-xs text-gray-600">شحنة في الطريق</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المعلقة</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-gray-600">
              {overdueInvoices > 0 && (
                <span className="text-red-600">
                  {overdueInvoices} فاتورة متأخرة
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الإحصائيات المالية والمخزون */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 ml-2" />
              الوضع المالي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">إجمالي الفواتير</span>
              <span className="font-semibold">{totalInvoiceAmount.toLocaleString('ar')} ريال</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">المبلغ المدفوع</span>
              <span className="font-semibold text-green-600">{paidAmount.toLocaleString('ar')} ريال</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">المبلغ المعلق</span>
              <span className="font-semibold text-yellow-600">{pendingAmount.toLocaleString('ar')} ريال</span>
            </div>
            <Progress 
              value={totalInvoiceAmount > 0 ? (paidAmount / totalInvoiceAmount) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 ml-2" />
              استخدام المخزون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">السعة الإجمالية</span>
              <span className="font-semibold">{totalCapacity.toLocaleString('ar')} وحدة</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">المساحة المستخدمة</span>
              <span className="font-semibold">{totalUsed.toLocaleString('ar')} وحدة</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">معدل الاستخدام</span>
              <span className={`font-semibold ${utilizationRate >= 90 ? 'text-red-600' : utilizationRate >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                {utilizationRate}%
              </span>
            </div>
            <Progress value={utilizationRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات والأنشطة الأخيرة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* التنبيهات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 ml-2 text-red-600" />
              التنبيهات المهمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems > 0 && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">مخزون منخفض</p>
                    <p className="text-xs text-red-600">{lowStockItems} صنف يحتاج إعادة تموين</p>
                  </div>
                </div>
              )}
              
              {overdueInvoices > 0 && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <FileText className="h-4 w-4 text-red-600 ml-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">فواتير متأخرة</p>
                    <p className="text-xs text-red-600">{overdueInvoices} فاتورة تجاوزت تاريخ الاستحقاق</p>
                  </div>
                </div>
              )}

              {activeShipments > 0 && (
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Truck className="h-4 w-4 text-blue-600 ml-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">شحنات في الطريق</p>
                    <p className="text-xs text-blue-600">{activeShipments} شحنة متوقع وصولها قريباً</p>
                  </div>
                </div>
              )}

              {lowStockItems === 0 && overdueInvoices === 0 && activeShipments === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">لا توجد تنبيهات في الوقت الحالي</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* الأنشطة الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 ml-2" />
              الأنشطة الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 space-x-reverse">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {activity.time.toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الأصناف منخفضة المخزون */}
      {lowStockItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 ml-2" />
              الأصناف منخفضة المخزون
            </CardTitle>
            <CardDescription>الأصناف التي تحتاج إعادة تموين (أقل من 20 وحدة)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الصنف</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>الكمية المتبقية</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.filter(item => item.quantity < 20).slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getSupplierName(item.supplierId)}</TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-600">
                        مخزون منخفض
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}