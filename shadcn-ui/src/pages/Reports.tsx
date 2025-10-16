import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, FileText, DollarSign, Package } from 'lucide-react';
import { mockItems, mockSuppliers, mockInvoices, mockShipments } from '@/data/mockData';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // حساب الإحصائيات
  const totalItemsValue = mockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalInvoicesValue = mockInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalShippingCosts = mockShipments.reduce((sum, shipment) => sum + shipment.shippingCost, 0);
  const lowStockItems = mockItems.filter(item => item.quantity < 20);

  // تقرير المخزون
  const inventoryReport = {
    totalItems: mockItems.length,
    totalValue: totalItemsValue,
    lowStockItems: lowStockItems.length,
    categories: mockItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // تقرير الموردين
  const suppliersReport = {
    totalSuppliers: mockSuppliers.length,
    activeSuppliers: mockSuppliers.length,
    topSuppliers: mockSuppliers.map(supplier => ({
      name: supplier.name,
      itemsCount: mockItems.filter(item => item.supplierId === supplier.id).length,
      totalValue: mockItems
        .filter(item => item.supplierId === supplier.id)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    })).sort((a, b) => b.totalValue - a.totalValue)
  };

  // تقرير التكاليف
  const costsReport = {
    totalPurchases: totalInvoicesValue,
    totalShipping: totalShippingCosts,
    totalCustoms: mockShipments.reduce((sum, shipment) => sum + shipment.customsFees, 0),
    monthlyTrend: [
      { month: 'يناير', amount: 45000 },
      { month: 'فبراير', amount: 52000 },
      { month: 'مارس', amount: 48000 },
      { month: 'أبريل', amount: 61000 },
    ]
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
            <div className="text-2xl font-bold">{inventoryReport.totalValue.toLocaleString('ar')}</div>
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
                <TableHead>الكمية الحالية</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-red-600 font-semibold">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
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
            <div className="text-lg font-bold">{suppliersReport.topSuppliers[0]?.name}</div>
            <p className="text-xs text-gray-600">
              {suppliersReport.topSuppliers[0]?.totalValue.toLocaleString('ar')} ريال
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
                  <TableCell>{supplier.totalValue.toLocaleString('ar')} ريال</TableCell>
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
            <div className="text-2xl font-bold">{costsReport.totalPurchases.toLocaleString('ar')}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تكاليف الشحن</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costsReport.totalShipping.toLocaleString('ar')}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسوم الجمركية</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costsReport.totalCustoms.toLocaleString('ar')}</div>
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
                  <TableCell>{month.amount.toLocaleString('ar')} ريال</TableCell>
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

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'inventory':
        return renderInventoryReport();
      case 'suppliers':
        return renderSuppliersReport();
      case 'costs':
        return renderCostsReport();
      default:
        return renderInventoryReport();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
          <p className="text-gray-600 mt-2">تقارير شاملة وتحليلات مفصلة للأعمال</p>
        </div>
        <Button className="flex items-center">
          <Download className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* فلاتر التقارير */}
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
              <Button variant="outline" className="flex items-center">
                <Calendar className="h-4 w-4 ml-2" />
                تخصيص الفترة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* محتوى التقرير */}
      {renderReportContent()}
    </div>
  );
}