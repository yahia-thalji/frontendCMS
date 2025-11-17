import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, FileText, DollarSign, Package, RefreshCw, Users, Ship } from 'lucide-react';
import { 
  useGetInventoryReport, 
  useGetSuppliersReport, 
  useGetCostsReport, 
  useGetShippingReport, 
  useExportReport,
  type InventoryReport,
  type SuppliersReport,
  type CostsReport,
  type ShippingReport
} from '@/pages/API/reportsAPI';
import { useGetAllCurrencies } from '@/pages/API/CurrenciesAPI';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // APIs
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading, 
    error: inventoryError,
    refetch: refetchInventory 
  } = useGetInventoryReport(selectedPeriod);
  
  const { 
    data: suppliersData, 
    isLoading: suppliersLoading,
    error: suppliersError,
    refetch: refetchSuppliers 
  } = useGetSuppliersReport();
  
  const { 
    data: costsData, 
    isLoading: costsLoading,
    error: costsError,
    refetch: refetchCosts 
  } = useGetCostsReport(selectedPeriod);
  
  const { 
    data: shippingData, 
    isLoading: shippingLoading,
    error: shippingError,
    refetch: refetchShipping 
  } = useGetShippingReport();
  
  const { 
    data: currenciesData 
  } = useGetAllCurrencies();

  const exportReportMutation = useExportReport();

  const currencies = Array.isArray(currenciesData) ? currenciesData : [];
  const baseCurrency = currencies.find(c => c.isBase);

  const loading = inventoryLoading || suppliersLoading || costsLoading || shippingLoading;
  const error = inventoryError || suppliersError || costsError || shippingError;

  const formatPrice = (amount: number): string => {
    if (!baseCurrency) return amount.toLocaleString('ar');
    return `${amount.toLocaleString('ar')} ${baseCurrency.symbol}`;
  };

  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

  const handleExportReport = () => {
    exportReportMutation.mutate({ 
      reportType: selectedReport, 
      format: 'json' 
    });
  };

  const handleRetry = () => {
    switch (selectedReport) {
      case 'inventory':
        refetchInventory();
        break;
      case 'suppliers':
        refetchSuppliers();
        break;
      case 'costs':
        refetchCosts();
        break;
      case 'shipping':
        refetchShipping();
        break;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'in_transit': 'في الطريق',
      'arrived': 'وصل',
      'customs': 'في الجمارك',
      'delivered': 'تم التسليم',
      'pending': 'قيد الانتظار',
      'paid': 'مدفوعة',
      'cancelled': 'ملغاة'
    };
    return statusLabels[status] || status;
  };

  const renderInventoryReport = () => {
    if (!inventoryData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryData.totalItems}</div>
              <p className="text-xs text-gray-600 mt-1">صنف مسجل</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(inventoryData.totalValue)}</div>
              <p className="text-xs text-gray-600">القيمة الإجمالية</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inventoryData.lowStockItems}</div>
              <p className="text-xs text-gray-600">صنف يحتاج تجديد</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فئات الأصناف</CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(inventoryData.categories).length}</div>
              <p className="text-xs text-gray-600">فئة مختلفة</p>
            </CardContent>
          </Card>
        </div>

        {/* فئات الأصناف */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الفئات</CardTitle>
            <CardDescription>توزيع الأصناف حسب الفئات المختلفة</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفئة</TableHead>
                  <TableHead>عدد الأصناف</TableHead>
                  <TableHead>النسبة المئوية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(inventoryData.categories).map(([category, count]) => (
                  <TableRow key={category}>
                    <TableCell className="font-medium">{category}</TableCell>
                    <TableCell>{safeToLocaleString(Number(count))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {inventoryData.totalItems > 0 ? 
                          Math.round((Number(count) / inventoryData.totalItems) * 100) : 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* الأصناف منخفضة المخزون */}
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
                  <TableHead>الرقم المرجعي</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>الكمية الحالية</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.lowStockItemsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.number}</TableCell>
                    <TableCell>{item.supplierName}</TableCell>
                    <TableCell>{item.locationName}</TableCell>
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
  };

  const renderSuppliersReport = () => {
    if (!suppliersData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliersData.totalSuppliers}</div>
              <p className="text-xs text-gray-600">مورد مسجل</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الموردين النشطين</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliersData.activeSuppliers}</div>
              <p className="text-xs text-gray-600">مورد نشط</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أفضل مورد</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{suppliersData.topSuppliers[0]?.name || 'لا يوجد'}</div>
              <p className="text-xs text-gray-600">
                {formatPrice(suppliersData.topSuppliers[0]?.totalValue || 0)}
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
                  <TableHead>الشخص المسؤول</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>عدد الأصناف</TableHead>
                  <TableHead>القيمة الإجمالية</TableHead>
                  <TableHead>التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliersData.topSuppliers.map((supplier, index) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson || 'غير محدد'}</TableCell>
                    <TableCell>{supplier.email || 'غير محدد'}</TableCell>
                    <TableCell>{supplier.phone || 'غير محدد'}</TableCell>
                    <TableCell>{supplier.itemsCount}</TableCell>
                    <TableCell>{formatPrice(supplier.totalValue)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        index === 0 ? "default" : 
                        index < 3 ? "secondary" : "outline"
                      }>
                        {index === 0 ? "ممتاز" : 
                         index < 3 ? "جيد جداً" : "جيد"}
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
  };

  const renderCostsReport = () => {
    if (!costsData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(costsData.totalPurchases)}</div>
              <p className="text-xs text-gray-600">قيمة المشتريات</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تكاليف الشحن</CardTitle>
              <Ship className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(costsData.totalShipping)}</div>
              <p className="text-xs text-gray-600">إجمالي الشحن</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رسوم الجمارك</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(costsData.totalCustoms)}</div>
              <p className="text-xs text-gray-600">إجمالي الجمارك</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التكاليف الإجمالية</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(costsData.totalCosts)}</div>
              <p className="text-xs text-gray-600">مجموع التكاليف</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الاتجاه الشهري للتكاليف</CardTitle>
            <CardDescription>تطور التكاليف خلال الفترة من {costsData.period.start} إلى {costsData.period.end}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشهر</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>التغيير</TableHead>
                  <TableHead>النسبة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costsData.monthlyTrend.map((month, index) => (
                  <TableRow key={month.month + month.year}>
                    <TableCell className="font-medium">{month.month} {month.year}</TableCell>
                    <TableCell>{formatPrice(month.amount)}</TableCell>
                    <TableCell>
                      {index > 0 && (
                        <Badge variant={
                          month.amount > costsData.monthlyTrend[index - 1].amount ? 
                          "destructive" : "default"
                        }>
                          {month.amount > costsData.monthlyTrend[index - 1].amount ? "↑ زيادة" : "↓ انخفاض"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {index > 0 && (
                        <span className={
                          month.amount > costsData.monthlyTrend[index - 1].amount ? 
                          "text-red-600 font-medium" : "text-green-600 font-medium"
                        }>
                          {Math.abs(
                            ((month.amount - costsData.monthlyTrend[index - 1].amount) / 
                            costsData.monthlyTrend[index - 1].amount) * 100
                          ).toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع التكاليف</CardTitle>
            <CardDescription>تحليل التكاليف حسب النوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {costsData.totalCosts > 0 ? 
                    Math.round((costsData.totalPurchases / costsData.totalCosts) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">المشتريات</p>
                <p className="text-lg font-semibold">{formatPrice(costsData.totalPurchases)}</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {costsData.totalCosts > 0 ? 
                    Math.round((costsData.totalShipping / costsData.totalCosts) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">الشحن</p>
                <p className="text-lg font-semibold">{formatPrice(costsData.totalShipping)}</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {costsData.totalCosts > 0 ? 
                    Math.round((costsData.totalCustoms / costsData.totalCosts) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">الجمارك</p>
                <p className="text-lg font-semibold">{formatPrice(costsData.totalCustoms)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderShippingReport = () => {
    if (!shippingData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
              <Ship className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingData.totalShipments}</div>
              <p className="text-xs text-gray-600">شحنة مسجلة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">في الطريق</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingData.inTransitShipments}</div>
              <p className="text-xs text-gray-600">شحنة نشطة</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تم التسليم</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippingData.deliveredShipments}</div>
              <p className="text-xs text-gray-600">شحنة مكتملة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط التكلفة</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(shippingData.averageShippingCost)}</div>
              <p className="text-xs text-gray-600">لكل شحنة</p>
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
                  <TableHead>التكلفة الإجمالية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(shippingData.statusBreakdown).map(([status, count]) => (
                  <TableRow key={status}>
                    <TableCell className="font-medium">
                      {getStatusLabel(status)}
                    </TableCell>
                    <TableCell>{safeToLocaleString(Number(count))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {shippingData.totalShipments > 0 ? 
                          Math.round((Number(count) / Number(shippingData.totalShipments)) * 100) : 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatPrice(
                        shippingData.recentShipments
                          .filter(shipment => shipment.status === status)
                          .reduce((sum, shipment) => sum + shipment.shippingCost, 0)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث الشحنات</CardTitle>
            <CardDescription>آخر 10 شحنات مسجلة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الحاوية</TableHead>
                  <TableHead>بوليصة الشحن</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>تاريخ المغادرة</TableHead>
                  <TableHead>تاريخ الوصول</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingData.recentShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.containerNumber}</TableCell>
                    <TableCell>{shipment.billOfLading}</TableCell>
                    <TableCell>{shipment.supplierName}</TableCell>
                    <TableCell>{shipment.departureDate}</TableCell>
                    <TableCell>{shipment.arrivalDate || 'غير محدد'}</TableCell>
                    <TableCell>{formatPrice(shipment.shippingCost)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        shipment.status === 'delivered' ? 'default' :
                        shipment.status === 'in_transit' ? 'secondary' :
                        shipment.status === 'customs' ? 'outline' : 'destructive'
                      }>
                        {getStatusLabel(shipment.status)}
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
  };

  const renderReportContent = () => {
    if (error) {
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
                {error instanceof Error ? error.message : 'تعذر تحميل بيانات التقرير'}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">تقارير شاملة وتحليلات مفصلة للأعمال</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRetry}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button 
            onClick={handleExportReport} 
            className="flex items-center"
            disabled={exportReportMutation.isLoading || loading}
          >
            <Download className="h-4 w-4 ml-2" />
            {exportReportMutation.isLoading ? 'جاري التصدير...' : 'تصدير التقرير'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">نوع التقرير</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-full">
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
            
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
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
              <Button variant="outline" className="flex items-center w-full sm:w-auto" disabled>
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