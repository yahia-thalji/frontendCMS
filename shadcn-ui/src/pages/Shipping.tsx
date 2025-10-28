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
import { Shipment, ShipmentItem, Item } from '@/types';
import { generateContainerNumber, generateBillOfLading } from '@/lib/autoNumber';
import { SupabaseShipmentsStorage, SupabaseItemsStorage } from '@/lib/supabaseStorage';

export default function Shipping() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    containerNumber: '',
    billOfLading: '',
    supplierId: '',
    status: '' as Shipment['status'] | '',
    departureDate: '',
    arrivalDate: ''
  });

  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([]);
  const [newItem, setNewItem] = useState({
    itemId: '',
    quantity: ''
  });

  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [shipmentsData, itemsData] = await Promise.all([
        SupabaseShipmentsStorage.getAll(),
        SupabaseItemsStorage.getAll()
      ]);
      setShipments(shipmentsData);
      setItems(itemsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribeShipments = SupabaseShipmentsStorage.subscribe((newShipments) => {
      setShipments(newShipments);
    });

    const unsubscribeItems = SupabaseItemsStorage.subscribe((newItems) => {
      setItems(newItems);
    });

    return () => {
      unsubscribeShipments();
      unsubscribeItems();
    };
  }, []);

  const filteredShipments = shipments.filter(shipment =>
    shipment?.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment?.billOfLading?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Shipment['status']) => {
    const statusConfig = {
      pending: { label: 'معلق', variant: 'outline' as const, color: 'text-yellow-600' },
      in_transit: { label: 'في الطريق', variant: 'outline' as const, color: 'text-blue-600' },
      arrived: { label: 'وصل', variant: 'outline' as const, color: 'text-green-600' },
      customs: { label: 'في الجمارك', variant: 'outline' as const, color: 'text-orange-600' },
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
    const item = items.find(i => i?.id === itemId);
    return item?.name || 'صنف غير محدد';
  };

  const resetForm = () => {
    setFormData({
      containerNumber: '',
      billOfLading: '',
      supplierId: '',
      status: '',
      departureDate: '',
      arrivalDate: ''
    });
    setShipmentItems([]);
    setNewItem({
      itemId: '',
      quantity: ''
    });
  };

  const handleAddShipment = async () => {
    setEditingShipment(null);
    resetForm();
    const [containerNumber, billOfLading] = await Promise.all([
      generateContainerNumber(),
      generateBillOfLading()
    ]);
    setFormData(prev => ({
      ...prev,
      containerNumber,
      billOfLading
    }));
    setIsDialogOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({
      containerNumber: shipment?.containerNumber || '',
      billOfLading: shipment?.billOfLading || '',
      supplierId: shipment?.supplierId || '',
      status: shipment?.status || 'pending',
      departureDate: shipment?.departureDate ? new Date(shipment.departureDate).toISOString().split('T')[0] : '',
      arrivalDate: shipment?.arrivalDate ? new Date(shipment.arrivalDate).toISOString().split('T')[0] : ''
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
      quantity: parseInt(newItem.quantity) || 0
    };

    setShipmentItems([...shipmentItems, item]);
    setNewItem({
      itemId: '',
      quantity: ''
    });
  };

  const handleRemoveItem = (index: number) => {
    setShipmentItems(shipmentItems.filter((_, i) => i !== index));
  };

  const handleSaveShipment = async () => {
    if (!formData.containerNumber || !formData.status || !formData.departureDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const shipmentData = {
        containerNumber: formData.containerNumber,
        billOfLading: formData.billOfLading,
        supplierId: formData.supplierId || null,
        status: formData.status as Shipment['status'],
        departureDate: formData.departureDate,
        arrivalDate: formData.arrivalDate || null,
        items: shipmentItems
      };

      if (editingShipment) {
        await SupabaseShipmentsStorage.update(editingShipment.id, shipmentData);
      } else {
        await SupabaseShipmentsStorage.add(shipmentData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ الشحنة:', error);
      alert('حدث خطأ أثناء حفظ الشحنة');
    }
  };

  const handleDeleteShipment = async (shipmentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشحنة؟')) {
      try {
        await SupabaseShipmentsStorage.delete(shipmentId);
      } catch (error) {
        console.error('خطأ في حذف الشحنة:', error);
        alert('حدث خطأ أثناء حذف الشحنة');
      }
    }
  };

  const totalShipments = shipments.length;
  const inTransitShipments = shipments.filter(s => s?.status === 'in_transit').length;
  const deliveredShipments = shipments.filter(s => s?.status === 'delivered').length;

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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-2">تتبع جميع الشحنات والحاويات</p>
        </div>
        <Button onClick={handleAddShipment} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة شحنة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث برقم الحاوية أو بوليصة الشحن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                <TableHead>رقم الحاوية</TableHead>
                <TableHead>بوليصة الشحن</TableHead>
                <TableHead>عدد الأصناف</TableHead>
                <TableHead>تاريخ المغادرة</TableHead>
                <TableHead>تاريخ الوصول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const StatusIcon = getStatusIcon(shipment?.status || 'pending');
                
                return (
                  <TableRow key={shipment?.id || Math.random()}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 ml-2 text-gray-500" />
                        {shipment?.containerNumber || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>{shipment?.billOfLading || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {shipment?.items?.length || 0} صنف
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1" />
                        {shipment?.departureDate ? new Date(shipment.departureDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment?.arrivalDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          {new Date(shipment.arrivalDate).toLocaleDateString('ar-SA')}
                        </div>
                      ) : (
                        <span className="text-gray-400">لم يصل بعد</span>
                      )}
                    </TableCell>
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
          
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                  <SelectItem value="pending">معلق</SelectItem>
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
          </div>

          <div className="border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">أصناف الشحنة</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label>الصنف</Label>
                <Select value={newItem.itemId} onValueChange={(value) => setNewItem(prev => ({...prev, itemId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصنف" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
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
                <Label>&nbsp;</Label>
                <Button onClick={handleAddItem} className="w-full">
                  إضافة الصنف
                </Button>
              </div>
            </div>

            {shipmentItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصنف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipmentItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{getItemName(item?.itemId || '')}</TableCell>
                      <TableCell>{item?.quantity || 0}</TableCell>
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