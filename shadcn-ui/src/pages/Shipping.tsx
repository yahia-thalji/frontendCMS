import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Truck, Ship, Package, MapPin, Calendar } from 'lucide-react';
import { mockShipments } from '@/data/mockData';
import { Shipment } from '@/types';

export default function Shipping() {
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  const filteredShipments = shipments.filter(shipment =>
    shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.containerNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Shipment['status']) => {
    const statusConfig = {
      in_transit: { label: 'في الطريق', variant: 'outline' as const, color: 'text-blue-600' },
      arrived: { label: 'وصل', variant: 'outline' as const, color: 'text-green-600' },
      customs: { label: 'في الجمارك', variant: 'outline' as const, color: 'text-yellow-600' },
      delivered: { label: 'تم التسليم', variant: 'outline' as const, color: 'text-purple-600' },
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: Shipment['status']) => {
    switch (status) {
      case 'in_transit':
        return Ship;
      case 'arrived':
        return MapPin;
      case 'customs':
        return Package;
      case 'delivered':
        return Truck;
      default:
        return Truck;
    }
  };

  const handleAddShipment = () => {
    setEditingShipment(null);
    setIsDialogOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setIsDialogOpen(true);
  };

  const handleDeleteShipment = (shipmentId: string) => {
    setShipments(shipments.filter(shipment => shipment.id !== shipmentId));
  };

  const totalShipments = shipments.length;
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit').length;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  const totalShippingCost = shipments.reduce((sum, shipment) => sum + shipment.shippingCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-2">تتبع جميع الشحنات والحاويات</p>
        </div>
        <Button onClick={handleAddShipment} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة شحنة جديدة
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShipments}</div>
            <p className="text-xs text-gray-600">شحنة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في الطريق</CardTitle>
            <Ship className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitShipments}</div>
            <p className="text-xs text-gray-600">شحنة في الطريق</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم التسليم</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredShipments}</div>
            <p className="text-xs text-gray-600">شحنة مسلمة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تكلفة الشحن</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShippingCost.toLocaleString('ar')}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والفلاتر */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث برقم الشحنة أو الحاوية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلتر حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="in_transit">في الطريق</SelectItem>
                <SelectItem value="arrived">وصل</SelectItem>
                <SelectItem value="customs">في الجمارك</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الشحنات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 ml-2" />
            قائمة الشحنات ({filteredShipments.length})
          </CardTitle>
          <CardDescription>جميع الشحنات والحاويات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الشحنة</TableHead>
                <TableHead>رقم الحاوية</TableHead>
                <TableHead>بوليصة الشحن</TableHead>
                <TableHead>تاريخ المغادرة</TableHead>
                <TableHead>تاريخ الوصول</TableHead>
                <TableHead>تكلفة الشحن</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const StatusIcon = getStatusIcon(shipment.status);
                
                return (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 ml-2 text-gray-500" />
                        {shipment.shipmentNumber}
                      </div>
                    </TableCell>
                    <TableCell>{shipment.containerNumber}</TableCell>
                    <TableCell>{shipment.billOfLading}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1" />
                        {shipment.departureDate.toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment.arrivalDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          {shipment.arrivalDate.toLocaleDateString('ar-SA')}
                        </div>
                      ) : (
                        <span className="text-gray-400">لم يصل بعد</span>
                      )}
                    </TableCell>
                    <TableCell>{shipment.shippingCost.toLocaleString('ar')} ريال</TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditShipment(shipment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShipment(shipment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة إضافة/تعديل الشحنة */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingShipment ? 'تعديل الشحنة' : 'إضافة شحنة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingShipment ? 'تعديل بيانات الشحنة المحددة' : 'إضافة شحنة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipmentNumber">رقم الشحنة</Label>
              <Input id="shipmentNumber" placeholder="أدخل رقم الشحنة" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="containerNumber">رقم الحاوية</Label>
              <Input id="containerNumber" placeholder="أدخل رقم الحاوية" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billOfLading">بوليصة الشحن</Label>
              <Input id="billOfLading" placeholder="أدخل رقم بوليصة الشحن" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">حالة الشحنة</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الشحنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_transit">في الطريق</SelectItem>
                  <SelectItem value="arrived">وصل</SelectItem>
                  <SelectItem value="customs">في الجمارك</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureDate">تاريخ المغادرة</Label>
              <Input id="departureDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalDate">تاريخ الوصول المتوقع</Label>
              <Input id="arrivalDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCost">تكلفة الشحن</Label>
              <Input id="shippingCost" type="number" placeholder="أدخل تكلفة الشحن" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customsFees">الرسوم الجمركية</Label>
              <Input id="customsFees" type="number" placeholder="أدخل الرسوم الجمركية" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {editingShipment ? 'حفظ التعديل' : 'إضافة الشحنة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}