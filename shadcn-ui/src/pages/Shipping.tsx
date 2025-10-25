import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Truck, Ship, Package, MapPin, Calendar, X } from 'lucide-react';
import { mockShipments } from '@/data/mockData';
import { Shipment, ShipmentItem } from '@/types';
import { AutoNumberGenerator } from '@/lib/autoNumber';
import { ShipmentsStorage, ItemsStorage } from '@/lib/localStorage';

export default function Shipping() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  // حالات النموذج
  const [formData, setFormData] = useState({
    shipmentNumber: '',
    containerNumber: '',
    billOfLading: '',
    status: '' as Shipment['status'] | '',
    departureDate: '',
    arrivalDate: '',
    shippingCost: '',
    customsFees: ''
  });

  // حالات الأصناف في الشحنة
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([]);
  const [newItem, setNewItem] = useState({
    itemId: '',
    quantity: '',
    weight: '',
    volume: ''
  });

  // دالة مساعدة لتنسيق الأرقام بأمان
  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    const storedShipments = ShipmentsStorage.getAll();
    if (storedShipments.length > 0) {
      setShipments(storedShipments);
    } else {
      // إذا لم توجد بيانات محفوظة، استخدم البيانات الوهمية وحفظها
      setShipments(mockShipments);
      ShipmentsStorage.save(mockShipments);
    }
  }, []);

  // حفظ تلقائي عند تغيير الشحنات
  useEffect(() => {
    if (shipments.length > 0) {
      ShipmentsStorage.save(shipments);
    }
  }, [shipments]);

  const filteredShipments = shipments.filter(shipment =>
    shipment?.shipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment?.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getItemName = (itemId: string) => {
    const items = ItemsStorage.getAll();
    const item = items.find(i => i?.id === itemId);
    return item?.name || 'صنف غير محدد';
  };

  const resetForm = () => {
    setFormData({
      shipmentNumber: '',
      containerNumber: '',
      billOfLading: '',
      status: '',
      departureDate: '',
      arrivalDate: '',
      shippingCost: '',
      customsFees: ''
    });
    setShipmentItems([]);
    setNewItem({
      itemId: '',
      quantity: '',
      weight: '',
      volume: ''
    });
  };

  const handleAddShipment = () => {
    setEditingShipment(null);
    resetForm();
    setFormData(prev => ({
      ...prev,
      shipmentNumber: AutoNumberGenerator.generateShipmentNumber(),
      containerNumber: AutoNumberGenerator.generateContainerNumber(),
      billOfLading: AutoNumberGenerator.generateBillOfLading()
    }));
    setIsDialogOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({
      shipmentNumber: shipment?.shipmentNumber || '',
      containerNumber: shipment?.containerNumber || '',
      billOfLading: shipment?.billOfLading || '',
      status: shipment?.status || 'in_transit',
      departureDate: shipment?.departureDate ? shipment.departureDate.toISOString().split('T')[0] : '',
      arrivalDate: shipment?.arrivalDate ? shipment.arrivalDate.toISOString().split('T')[0] : '',
      shippingCost: (shipment?.shippingCost || 0).toString(),
      customsFees: (shipment?.customsFees || 0).toString()
    });
    setShipmentItems(shipment?.items || []);
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.itemId || !newItem.quantity) {
      alert('يرجى اختيار الصنف وإدخال الكمية');
      return;
    }

    const item: ShipmentItem = {
      itemId: newItem.itemId,
      quantity: parseInt(newItem.quantity) || 0,
      weight: parseFloat(newItem.weight) || 0,
      volume: parseFloat(newItem.volume) || 0
    };

    setShipmentItems([...shipmentItems, item]);
    setNewItem({
      itemId: '',
      quantity: '',
      weight: '',
      volume: ''
    });
  };

  const handleRemoveItem = (index: number) => {
    setShipmentItems(shipmentItems.filter((_, i) => i !== index));
  };

  const updateInventoryOnDelivery = (items: ShipmentItem[], isDelivered: boolean) => {
    if (!isDelivered) return;

    const allItems = ItemsStorage.getAll();
    let updated = false;

    const updatedItems = allItems.map(item => {
      const shipmentItem = items.find(si => si.itemId === item.id);
      if (shipmentItem) {
        updated = true;
        return {
          ...item,
          quantity: (item.quantity || 0) + shipmentItem.quantity
        };
      }
      return item;
    });

    if (updated) {
      ItemsStorage.save(updatedItems);
    }
  };

  const handleSaveShipment = () => {
    if (!formData.shipmentNumber || !formData.containerNumber || !formData.status || !formData.departureDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newShipment: Shipment = {
      id: editingShipment?.id || Date.now().toString(),
      shipmentNumber: formData.shipmentNumber,
      containerNumber: formData.containerNumber,
      billOfLading: formData.billOfLading,
      status: formData.status as Shipment['status'],
      departureDate: new Date(formData.departureDate),
      arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate) : null,
      shippingCost: parseFloat(formData.shippingCost) || 0,
      customsFees: parseFloat(formData.customsFees) || 0,
      items: shipmentItems,
      createdAt: editingShipment?.createdAt || new Date()
    };

    // تحديث المخزون إذا كانت الحالة "تم التسليم"
    if (formData.status === 'delivered' && (!editingShipment || editingShipment.status !== 'delivered')) {
      updateInventoryOnDelivery(shipmentItems, true);
    }

    if (editingShipment) {
      // تحديث الشحنة الموجودة
      const updatedShipments = shipments.map(shipment => 
        shipment?.id === editingShipment.id ? newShipment : shipment
      );
      setShipments(updatedShipments);
    } else {
      // إضافة شحنة جديدة
      setShipments([...shipments, newShipment]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteShipment = (shipmentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشحنة؟')) {
      const updatedShipments = shipments.filter(shipment => shipment?.id !== shipmentId);
      setShipments(updatedShipments);
    }
  };

  const totalShipments = shipments.length;
  const inTransitShipments = shipments.filter(s => s?.status === 'in_transit').length;
  const deliveredShipments = shipments.filter(s => s?.status === 'delivered').length;
  const totalShippingCost = shipments.reduce((sum, shipment) => sum + (shipment?.shippingCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-2">تتبع جميع الشحنات والحاويات مع إدارة الأصناف</p>
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
            <div className="text-2xl font-bold">{safeToLocaleString(totalShippingCost)}</div>
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
                <TableHead>عدد الأصناف</TableHead>
                <TableHead>تاريخ المغادرة</TableHead>
                <TableHead>تاريخ الوصول</TableHead>
                <TableHead>تكلفة الشحن</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const StatusIcon = getStatusIcon(shipment?.status || 'in_transit');
                
                return (
                  <TableRow key={shipment?.id || Math.random()}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 ml-2 text-gray-500" />
                        {shipment?.shipmentNumber || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>{shipment?.containerNumber || 'غير محدد'}</TableCell>
                    <TableCell>{shipment?.billOfLading || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {shipment?.items?.length || 0} صنف
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1" />
                        {shipment?.departureDate ? shipment.departureDate.toLocaleDateString('ar-SA') : 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment?.arrivalDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          {shipment.arrivalDate.toLocaleDateString('ar-SA')}
                        </div>
                      ) : (
                        <span className="text-gray-400">لم يصل بعد</span>
                      )}
                    </TableCell>
                    <TableCell>{safeToLocaleString(shipment?.shippingCost)} ريال</TableCell>
                    <TableCell>{shipment?.status ? getStatusBadge(shipment.status) : 'غير محدد'}</TableCell>
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
                          onClick={() => handleDeleteShipment(shipment?.id || '')}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShipment ? 'تعديل الشحنة' : 'إضافة شحنة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingShipment ? 'تعديل بيانات الشحنة المحددة' : 'إضافة شحنة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          
          {/* بيانات الشحنة الأساسية */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="shipmentNumber">رقم الشحنة</Label>
              <Input 
                id="shipmentNumber" 
                value={formData.shipmentNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="containerNumber">رقم الحاوية</Label>
              <Input 
                id="containerNumber" 
                value={formData.containerNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billOfLading">بوليصة الشحن</Label>
              <Input 
                id="billOfLading" 
                value={formData.billOfLading}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">حالة الشحنة *</Label>
              <Select value={formData.status} onValueChange={(value: Shipment['status']) => setFormData(prev => ({...prev, status: value}))}>
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
              <Label htmlFor="departureDate">تاريخ المغادرة *</Label>
              <Input 
                id="departureDate" 
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({...prev, departureDate: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalDate">تاريخ الوصول المتوقع</Label>
              <Input 
                id="arrivalDate" 
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => setFormData(prev => ({...prev, arrivalDate: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCost">تكلفة الشحن</Label>
              <Input 
                id="shippingCost" 
                type="number" 
                placeholder="أدخل تكلفة الشحن"
                value={formData.shippingCost}
                onChange={(e) => setFormData(prev => ({...prev, shippingCost: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customsFees">الرسوم الجمركية</Label>
              <Input 
                id="customsFees" 
                type="number" 
                placeholder="أدخل الرسوم الجمركية"
                value={formData.customsFees}
                onChange={(e) => setFormData(prev => ({...prev, customsFees: e.target.value}))}
              />
            </div>
          </div>

          {/* إضافة الأصناف */}
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">أصناف الشحنة</h3>
            
            {/* نموذج إضافة صنف جديد */}
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div className="space-y-2">
                <Label>الصنف</Label>
                <Select value={newItem.itemId} onValueChange={(value) => setNewItem(prev => ({...prev, itemId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصنف" />
                  </SelectTrigger>
                  <SelectContent>
                    {ItemsStorage.getAll().map((item) => (
                      <SelectItem key={item?.id} value={item?.id || ''}>
                        {item?.name || 'غير محدد'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input 
                  type="number" 
                  placeholder="الكمية"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({...prev, quantity: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>الوزن (كجم)</Label>
                <Input 
                  type="number" 
                  placeholder="الوزن"
                  value={newItem.weight}
                  onChange={(e) => setNewItem(prev => ({...prev, weight: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>الحجم (م³)</Label>
                <Input 
                  type="number" 
                  placeholder="الحجم"
                  value={newItem.volume}
                  onChange={(e) => setNewItem(prev => ({...prev, volume: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={handleAddItem} className="w-full">
                  إضافة الصنف
                </Button>
              </div>
            </div>

            {/* قائمة الأصناف المضافة */}
            {shipmentItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصنف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الوزن (كجم)</TableHead>
                    <TableHead>الحجم (م³)</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipmentItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{getItemName(item?.itemId || '')}</TableCell>
                      <TableCell>{item?.quantity || 0}</TableCell>
                      <TableCell>{item?.weight || 0}</TableCell>
                      <TableCell>{item?.volume || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveShipment}>
              {editingShipment ? 'حفظ التعديل' : 'إضافة الشحنة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}