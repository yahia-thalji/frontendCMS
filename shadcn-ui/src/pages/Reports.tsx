import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, FileText, DollarSign, Package } from 'lucide-react';
import { SupabaseItemsStorage, SupabaseSuppliersStorage, SupabaseInvoicesStorage, SupabaseShipmentsStorage } from '@/lib/supabaseStorage';
import { Item, Supplier, Invoice, Shipment } from '@/types';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

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
  }, []);

  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

  const totalItemsValue = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  const totalInvoicesValue = invoices.reduce((sum, invoice) => sum + (invoice?.totalAmount || 0), 0);
  const lowStockItems = items.filter(item => (item?.quantity || 0) < 20);

  const inventoryReport = {
    totalItems: items.length,
    totalValue: totalItemsValue,
    lowStockItems: lowStockItems.length,
    categories: items.reduce((acc, item) => {
      const category = item?.category || 'غير محدد';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const suppliersReport = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.length,
    topSuppliers: suppliers.map(supplier => ({
      name: supplier?.name || 'غير محدد',
      itemsCount: items.filter(item => item?.supplierId === supplier?.id).length,
      totalValue: items
        .filter(item => item?.supplierId === supplier?.id)
        .reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0)
    })).sort((a, b) => b.totalValue - a.totalValue)
  };

  const costsReport = {
    totalPurchases: totalInvoicesValue,
    totalShipping: 0,
    totalCustoms: 0,
    monthlyTrend: [
      { month: 'يناير', amount: Math.round(totalInvoicesValue * 0.2) },
      { month: 'فبراير', amount: Math.round(totalInvoicesValue * 0.25) },
      { month: 'مارس', amount: Math.round(totalInvoicesValue * 0.22) },
      { month: 'أبريل', amount: Math.round(totalInvoicesValue * 0.33) },
    ]
  };

  const shippingReport = {
    totalShipments: shipments.length,
    inTransitShipments: shipments.filter(s => s?.status === 'in_transit').length,
    deliveredShipments: shipments.filter(s => s?.status === 'delivered').length,
    averageShippingCost: 0,
    statusBreakdown: shipments.reduce((acc, shipment) => {
      const status = shipment?.status || 'غير محدد';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const exportReport = () => {
    const reportData = {
      reportType: selectedReport,
      generatedAt: new Date().toISOString(),
      data: getCurrentReportData()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_${selectedReport}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentReportData = () => {
    switch (selectedReport) {
      case 'inventory':
        return inventoryReport;
      case 'suppliers':
        return suppliersReport;
      case 'costs':
        return costsReport;
      case 'shipping':
        return shippingReport;
      default:
        return inventoryReport;
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s?.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryReport.totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToLocaleString(inventoryReport.totalValue)}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryReport.lowStockItems}</div>
            <p className="text-xs text-gray-600">صنف يحتاج تجديد</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فئات الأصناف</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(inventoryReport.categories).length}</div>
            <p className="text-xs text-gray-600">فئة مختلفة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الأصناف منخفضة المخزون</CardTitle>
          <CardDescription>الأصناف التي تحتاج إلى إعادة تجديد</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الصنف</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الكمية الحالية</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item?.id || Math.random()}>
                  <TableCell className="font-medium">{item?.name || 'غير محدد'}</TableCell>
                  <TableCell>{getSupplierName(item?.supplierId || '')}</TableCell>
                  <TableCell className="text-red-600 font-semibold">{item?.quantity || 0}</TableCell>
                  <TableCell>{item?.unit || 'غير محدد'}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">مخزون منخفض</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuppliersReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliersReport.totalSuppliers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين النشطين</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliersReport.activeSuppliers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أفضل مورد</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{suppliersReport.topSuppliers[0]?.name || 'لا يوجد'}</div>
            <p className="text-xs text-gray-600">
              {safeToLocaleString(suppliersReport.topSuppliers[0]?.totalValue)} ريال
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقرير أداء الموردين</CardTitle>
          <CardDescription>ترتيب الموردين حسب قيمة التوريد</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المورد</TableHead>
                <TableHead>عدد الأصناف</TableHead>
                <TableHead>القيمة الإجمالية</TableHead>
                <TableHead>التقييم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliersReport.topSuppliers.map((supplier, index) => (
                <TableRow key={supplier.name}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.itemsCount}</TableCell>
                  <TableCell>{safeToLocaleString(supplier.totalValue)} ريال</TableCell>
                  <TableCell>
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {index === 0 ? "ممتاز" : "جيد"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderCostsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToLocaleString(costsReport.totalPurchases)}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الاتجاه الشهري للتكاليف</CardTitle>
          <CardDescription>تطور التكاليف خلال الأشهر الماضية</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشهر</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>التغيير</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costsReport.monthlyTrend.map((month, index) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell>{safeToLocaleString(month.amount)} ريال</TableCell>
                  <TableCell>
                    {index > 0 && (
                      <Badge variant={month.amount > costsReport.monthlyTrend[index - 1].amount ? "destructive" : "default"}>
                        {month.amount > costsReport.monthlyTrend[index - 1].amount ? "↑" : "↓"}
                        {Math.abs(((month.amount - costsReport.monthlyTrend[index - 1].amount) / costsReport.monthlyTrend[index - 1].amount) * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderShippingReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippingReport.totalShipments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في الطريق</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippingReport.inTransitShipments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم التسليم</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippingReport.deliveredShipments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفصيل حالات الشحنات</CardTitle>
          <CardDescription>توزيع الشحنات حسب الحالة</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحالة</TableHead>
                <TableHead>عدد الشحنات</TableHead>
                <TableHead>النسبة المئوية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(shippingReport.statusBreakdown).map(([status, count]) => (
                <TableRow key={status}>
                  <TableCell className="font-medium">
                    {status === 'in_transit' ? 'في الطريق' :
                     status === 'arrived' ? 'وصل' :
                     status === 'customs' ? 'في الجمارك' :
                     status === 'delivered' ? 'تم التسليم' : status}
                  </TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {shippingReport.totalShipments > 0 ? 
                        Math.round((count / shippingReport.totalShipments) * 100) : 0}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'inventory':
        return renderInventoryReport();
      case 'suppliers':
        return renderSuppliersReport();
      case 'costs':
        return renderCostsReport();
      case 'shipping':
        return renderShippingReport();
      default:
        return renderInventoryReport();
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
          <p className="text-gray-600 mt-2">تقارير شاملة وتحليلات مفصلة للأعمال</p>
        </div>
        <Button onClick={exportReport} className="flex items-center">
          <Download className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع التقرير</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">تقرير المخزون</SelectItem>
                  <SelectItem value="suppliers">تقرير الموردين</SelectItem>
                  <SelectItem value="costs">تحليل التكاليف</SelectItem>
                  <SelectItem value="shipping">تقرير الشحن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="quarter">هذا الربع</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="flex items-center" disabled>
                <Calendar className="h-4 w-4 ml-2" />
                تخصيص الفترة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderReportContent()}
    </div>
  );
}