import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Users, FileText, Truck, TrendingUp, AlertTriangle } from 'lucide-react';
import { mockItems, mockSuppliers, mockInvoices, mockShipments } from '@/data/mockData';

export default function Dashboard() {
  const totalItems = mockItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalInvoiceValue = mockInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingShipments = mockShipments.filter(s => s.status === 'in_transit').length;
  
  const stats = [
    {
      title: 'إجمالي الأصناف',
      value: totalItems.toLocaleString('ar'),
      icon: Package,
      description: 'قطعة في المخزن',
      trend: '+12%',
      color: 'text-blue-600'
    },
    {
      title: 'الموردين النشطين',
      value: mockSuppliers.length.toString(),
      icon: Users,
      description: 'مورد مسجل',
      trend: '+2',
      color: 'text-green-600'
    },
    {
      title: 'قيمة الفواتير',
      value: totalInvoiceValue.toLocaleString('ar'),
      icon: FileText,
      description: 'ريال سعودي',
      trend: '+8%',
      color: 'text-purple-600'
    },
    {
      title: 'الشحنات المعلقة',
      value: pendingShipments.toString(),
      icon: Truck,
      description: 'شحنة في الطريق',
      trend: '-1',
      color: 'text-orange-600'
    },
  ];

  const recentActivities = [
    { id: 1, action: 'وصول شحنة جديدة', item: 'مضخة مياه صناعية', time: 'منذ ساعتين', status: 'success' },
    { id: 2, action: 'فاتورة جديدة', item: 'INV-2024-002', time: 'منذ 4 ساعات', status: 'info' },
    { id: 3, action: 'تحديث مخزون', item: 'صمام تحكم هيدروليكي', time: 'منذ يوم', status: 'warning' },
    { id: 4, action: 'مورد جديد', item: 'شركة الخليج للتجارة', time: 'منذ يومين', status: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2">نظرة عامة على نشاط إدارة حاويات الاستيراد</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stat.description}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
                  <span className="text-xs text-green-600">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* النشاطات الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
            <CardDescription>آخر العمليات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 space-x-reverse">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.item}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* تنبيهات مهمة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 ml-2" />
              تنبيهات مهمة
            </CardTitle>
            <CardDescription>عناصر تحتاج إلى انتباهك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">مخزون منخفض</p>
                  <p className="text-xs text-gray-600">صمام تحكم هيدروليكي - 15 قطعة متبقية</p>
                </div>
                <Badge variant="outline" className="text-yellow-600">
                  تحذير
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">فاتورة متأخرة</p>
                  <p className="text-xs text-gray-600">INV-2024-001 - متأخرة 5 أيام</p>
                </div>
                <Badge variant="destructive">
                  عاجل
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">شحنة واصلة</p>
                  <p className="text-xs text-gray-600">حاوية CONT-002 وصلت اليوم</p>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  جديد
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}