import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Ship, Calendar, MapPin } from 'lucide-react';
import { Shipment, Item, Location } from '@/types';
import { generateShipmentNumber } from '@/lib/autoNumber';
import { SupabaseShipmentsStorage, SupabaseItemsStorage, SupabaseLocationsStorage } from '@/lib/supabaseStorage';

interface ShippingProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Shipping({ quickActionTrigger }: ShippingProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    shipmentNumber: '',
    itemId: '',
    quantity: '',
    origin: '',
    destination: '',
    locationId: '',
    departureDate: new Date().toISOString().split('T')[0],
    arrivalDate: '',
    status: 'pending' as Shipment['status'],
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shipmentsData, itemsData, locationsData] = await Promise.all([
        SupabaseShipmentsStorage.getAll(),
        SupabaseItemsStorage.getAll(),
        SupabaseLocationsStorage.getAll()
      ]);
      setShipments(shipmentsData);
      setItems(itemsData);
      setLocations(locationsData);
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

    const unsubscribeLocations = SupabaseLocationsStorage.subscribe((newLocations) => {
      setLocations(newLocations);
    });

    return () => {
      unsubscribeShipments();
      unsubscribeItems();
      unsubscribeLocations();
    };
  }, []);

  // Handle quick action trigger
  useEffect(() => {
    if (quickActionTrigger?.action === 'add-shipment') {
      handleAddShipment();
    }
  }, [quickActionTrigger]);

  const filteredShipments = shipments.filter(shipment =>
    shipment?.shipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemName = (itemId: string) => {
    if (!itemId) return 'غير محدد';
    const item = items.find(i => i?.id === itemId);
    return item?.name || 'غير محدد';
  };

  const getLocationName = (locationId: string) => {
    if (!locationId) return 'غير محدد';
    const location = locations.find(l => l?.id === locationId);
    return location?.name || 'غير محدد';
  };

  const resetForm = () => {
    setFormData({
      shipmentNumber: '',
      itemId: '',
      quantity: '',
      origin: '',
      destination: '',
      locationId: '',
      departureDate: new Date().toISOString().split('T')[0],
      arrivalDate: '',
      status: 'pending',
      notes: ''
    });
  };

  const handleAddShipment = async () => {
    setEditingShipment(null);
    resetForm();
    const shipmentNumber = await generateShipmentNumber();
    setFormData(prev => ({
      ...prev,
      shipmentNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({
      shipmentNumber: shipment?.shipmentNumber || '',
      itemId: shipment?.itemId || '',
      quantity: (shipment?.quantity || 0).toString(),
      origin: shipment?.origin || '',
      destination: shipment?.destination || '',
      locationId: shipment?.locationId || '',
      departureDate: shipment?.departureDate || new Date().toISOString().split('T')[0],
      arrivalDate: shipment?.arrivalDate || '',
      status: shipment?.status || 'pending',
      notes: shipment?.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveShipment = async () => {
    if (!formData.itemId || !formData.quantity || !formData.origin || !formData.destination) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const shipmentData = {
        shipmentNumber: formData.shipmentNumber,
        itemId: formData.itemId,
        quantity: parseInt(formData.quantity) || 0,
        origin: formData.origin,
        destination: formData.destination,
        locationId: formData.locationId,
        departureDate: formData.departureDate,
        arrivalDate: formData.arrivalDate,
        status: formData.status,
        notes: formData.notes
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

  const getStatusBadge = (status: Shipment['status']) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      in_transit: { label: 'في الطريق', className: 'bg-blue-100 text-blue-800' },
      delivered: { label: 'تم التسليم', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغاة', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-2">إدارة جميع الشحنات والحاويات</p>
        </div>
        <Button onClick={handleAddShipment} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة شحنة جديدة
        </Button>
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
                placeholder="البحث برقم الشحنة..."
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
            <Ship className="h-5 w-5 ml-2" />
            قائمة الشحنات ({filteredShipments.length})
          </CardTitle>
          <CardDescription>جميع الشحنات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الشحنة</TableHead>
                <TableHead>الصنف</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>تاريخ المغادرة</TableHead>
                <TableHead>تاريخ الوصول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow key={shipment?.id}>
                  <TableCell className="font-medium">{shipment?.shipmentNumber || 'غير محدد'}</TableCell>
                  <TableCell>{getItemName(shipment?.itemId || '')}</TableCell>
                  <TableCell>{shipment?.quantity || 0}</TableCell>
                  <TableCell>{shipment?.origin || 'غير محدد'}</TableCell>
                  <TableCell>{shipment?.destination || 'غير محدد'}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 ml-1" />
                      {getLocationName(shipment?.locationId || '')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 ml-1" />
                      {shipment?.departureDate || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 ml-1" />
                      {shipment?.arrivalDate || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(shipment?.status || 'pending')}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              <Input 
                id="shipmentNumber" 
                value={formData.shipmentNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item">الصنف *</Label>
              <Select value={formData.itemId} onValueChange={(value) => setFormData(prev => ({...prev, itemId: value}))}>
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
              <Label htmlFor="quantity">الكمية *</Label>
              <Input 
                id="quantity" 
                type="number"
                placeholder="أدخل الكمية"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({...prev, quantity: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">الموقع</Label>
              <Select value={formData.locationId} onValueChange={(value) => setFormData(prev => ({...prev, locationId: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location?.id} value={location?.id || ''}>
                      {location?.name || 'غير محدد'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">من *</Label>
              <Input 
                id="origin" 
                placeholder="أدخل مكان المغادرة"
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({...prev, origin: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">إلى *</Label>
              <Input 
                id="destination" 
                placeholder="أدخل مكان الوصول"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({...prev, destination: e.target.value}))}
              />
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
              <Label htmlFor="arrivalDate">تاريخ الوصول</Label>
              <Input 
                id="arrivalDate" 
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => setFormData(prev => ({...prev, arrivalDate: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">الحالة *</Label>
              <Select value={formData.status} onValueChange={(value: Shipment['status']) => setFormData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="in_transit">في الطريق</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea 
                id="notes" 
                placeholder="أدخل أي ملاحظات إضافية"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
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