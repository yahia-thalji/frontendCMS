import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Ship, Calendar, Package, DollarSign, X } from 'lucide-react';
import { Shipment, ShipmentItem, Item, Supplier } from '@/types';
import { SupabaseShipmentsStorage, SupabaseItemsStorage, SupabaseSuppliersStorage } from '@/lib/supabaseStorage';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrency } from '@/hooks/useCurrency';
import { formatWithBaseCurrency } from '@/lib/currencyUtils';

interface ShippingProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Shipping({ quickActionTrigger }: ShippingProps) {
  const isMobile = useIsMobile();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  const { currencies, baseCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    containerNumber: '',
    billOfLading: '',
    supplierId: '',
    departureDate: new Date().toISOString().split('T')[0],
    arrivalDate: '',
    status: 'in_transit' as Shipment['status'],
    shippingCost: '',
    customsFees: '',
    insurance: '',
    items: [] as ShipmentItem[]
  });

  // Item form for adding items to shipment
  const [itemForm, setItemForm] = useState({
    itemId: '',
    quantity: '',
    weight: '',
    volume: ''
  });

  const formatPrice = (amount: number): string => {
    return formatWithBaseCurrency(amount, currencies);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [shipmentsData, itemsData, suppliersData] = await Promise.all([
        SupabaseShipmentsStorage.getAll(),
        SupabaseItemsStorage.getAll(),
        SupabaseSuppliersStorage.getAll()
      ]);
      setShipments(shipmentsData);
      setItems(itemsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('فشل تحميل البيانات');
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

    const unsubscribeSuppliers = SupabaseSuppliersStorage.subscribe((newSuppliers) => {
      setSuppliers(newSuppliers);
    });

    return () => {
      unsubscribeShipments();
      unsubscribeItems();
      unsubscribeSuppliers();
    };
  }, []);

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-shipment') {
      handleAddShipment();
    }
  }, [quickActionTrigger]);

  const filteredShipments = shipments.filter(shipment =>
    shipment?.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment?.billOfLading?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    if (!supplierId) return 'غير محدد';
    const supplier = suppliers.find(s => s?.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getItemName = (itemId: string) => {
    if (!itemId) return 'غير محدد';
    const item = items.find(i => i?.id === itemId);
    return item?.name || 'غير محدد';
  };

  const resetForm = () => {
    setFormData({
      containerNumber: '',
      billOfLading: '',
      supplierId: '',
      departureDate: new Date().toISOString().split('T')[0],
      arrivalDate: '',
      status: 'in_transit',
      shippingCost: '',
      customsFees: '',
      insurance: '',
      items: []
    });
    setItemForm({
      itemId: '',
      quantity: '',
      weight: '',
      volume: ''
    });
  };

  const handleAddShipment = () => {
    setEditingShipment(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setFormData({
      containerNumber: shipment?.containerNumber || '',
      billOfLading: shipment?.billOfLading || '',
      supplierId: shipment?.supplierId || '',
      departureDate: shipment?.departureDate || new Date().toISOString().split('T')[0],
      arrivalDate: shipment?.arrivalDate || '',
      status: shipment?.status || 'in_transit',
      shippingCost: (shipment?.shippingCost || 0).toString(),
      customsFees: (shipment?.customsFees || 0).toString(),
      insurance: (shipment?.insurance || 0).toString(),
      items: shipment?.items || []
    });
    setIsDialogOpen(true);
  };

  const handleAddItemToShipment = () => {
    if (!itemForm.itemId || !itemForm.quantity) {
      toast.error('يرجى اختيار الصنف وإدخال الكمية');
      return;
    }

    const newItem: ShipmentItem = {
      itemId: itemForm.itemId,
      quantity: parseInt(itemForm.quantity) || 0,
      weight: itemForm.weight ? parseFloat(itemForm.weight) : undefined,
      volume: itemForm.volume ? parseFloat(itemForm.volume) : undefined
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setItemForm({
      itemId: '',
      quantity: '',
      weight: '',
      volume: ''
    });

    toast.success('تم إضافة الصنف إلى الشحنة');
  };

  const handleRemoveItemFromShipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    toast.success('تم إزالة الصنف من الشحنة');
  };

  const handleSaveShipment = async () => {
    if (!formData.containerNumber || !formData.billOfLading || !formData.supplierId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('يرجى إضافة صنف واحد على الأقل إلى الشحنة');
      return;
    }

    try {
      const shipmentData = {
        containerNumber: formData.containerNumber,
        billOfLading: formData.billOfLading,
        supplierId: formData.supplierId,
        departureDate: formData.departureDate,
        arrivalDate: formData.arrivalDate || null,
        status: formData.status,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        customsFees: parseFloat(formData.customsFees) || 0,
        insurance: formData.insurance ? parseFloat(formData.insurance) : undefined,
        currencyId: baseCurrency?.id || undefined,
        items: formData.items
      };

      if (editingShipment) {
        await SupabaseShipmentsStorage.update(editingShipment.id, shipmentData);
        toast.success('تم تحديث الشحنة بنجاح');
      } else {
        await SupabaseShipmentsStorage.add(shipmentData);
        toast.success('تم إضافة الشحنة بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ الشحنة:', error);
      toast.error('حدث خطأ أثناء حفظ الشحنة');
    }
  };

  const handleDeleteShipment = async (shipmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشحنة؟')) return;

    try {
      const result = await SupabaseShipmentsStorage.delete(shipmentId);
      if (result.success) {
        toast.success('تم حذف الشحنة بنجاح');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('خطأ في حذف الشحنة:', error);
      toast.error('حدث خطأ أثناء حذف الشحنة');
    }
  };

  const getStatusBadge = (status: Shipment['status']) => {
    const statusConfig = {
      in_transit: { label: 'في الطريق', className: 'bg-blue-100 text-blue-800' },
      arrived: { label: 'وصلت', className: 'bg-green-100 text-green-800' },
      customs: { label: 'في الجمارك', className: 'bg-yellow-100 text-yellow-800' },
      delivered: { label: 'تم التسليم', className: 'bg-emerald-100 text-emerald-800' }
    };
    const config = statusConfig[status] || statusConfig.in_transit;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const calculateTotalCost = (shipment: Shipment) => {
    const shipping = shipment?.shippingCost || 0;
    const customs = shipment?.customsFees || 0;
    const insurance = shipment?.insurance || 0;
    return shipping + customs + insurance;
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-2">إدارة جميع الشحنات والحاويات</p>
          {baseCurrency && (
            <p className="text-xs text-gray-500 mt-1">جميع التكاليف بـ {baseCurrency.name} ({baseCurrency.symbol})</p>
          )}
        </div>
        <Button onClick={handleAddShipment} className="flex items-center w-full sm:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          إضافة شحنة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث برقم الحاوية أو بوليصة الشحن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
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
          {isMobile ? (
            <div className="space-y-4">
              {filteredShipments.map((shipment) => (
                <Card key={shipment?.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{shipment?.containerNumber}</p>
                          <p className="text-sm text-gray-600">{shipment?.billOfLading}</p>
                        </div>
                        {getStatusBadge(shipment?.status || 'in_transit')}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">المورد</p>
                          <p className="font-medium">{getSupplierName(shipment?.supplierId || '')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          <span>{shipment?.departureDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 ml-1" />
                          <span>{shipment?.arrivalDate || 'غير محدد'}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3 w-3 ml-1" />
                        <span>التكلفة الإجمالية: {formatPrice(calculateTotalCost(shipment))}</span>
                      </div>

                      <div className="flex items-center text-sm">
                        <Package className="h-3 w-3 ml-1" />
                        <span>عدد الأصناف: {shipment?.items?.length || 0}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditShipment(shipment)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShipment(shipment?.id || '')}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الحاوية</TableHead>
                    <TableHead>بوليصة الشحن</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>تاريخ المغادرة</TableHead>
                    <TableHead>تاريخ الوصول</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التكلفة الإجمالية</TableHead>
                    <TableHead>الأصناف</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment?.id}>
                      <TableCell className="font-medium">{shipment?.containerNumber}</TableCell>
                      <TableCell>{shipment?.billOfLading}</TableCell>
                      <TableCell>{getSupplierName(shipment?.supplierId || '')}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 ml-1" />
                          {shipment?.departureDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 ml-1" />
                          {shipment?.arrivalDate || 'غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment?.status || 'in_transit')}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 ml-1" />
                          {formatPrice(calculateTotalCost(shipment))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="h-3 w-3 ml-1" />
                          {shipment?.items?.length || 0}
                        </div>
                      </TableCell>
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
            </div>
          )}
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
              {baseCurrency && (
                <span className="block mt-1 text-xs">جميع التكاليف بـ {baseCurrency.name} ({baseCurrency.symbol})</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* معلومات الشحنة الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="containerNumber">رقم الحاوية *</Label>
                <Input 
                  id="containerNumber" 
                  placeholder="أدخل رقم الحاوية"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData(prev => ({...prev, containerNumber: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billOfLading">بوليصة الشحن *</Label>
                <Input 
                  id="billOfLading" 
                  placeholder="أدخل رقم بوليصة الشحن"
                  value={formData.billOfLading}
                  onChange={(e) => setFormData(prev => ({...prev, billOfLading: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد *</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({...prev, supplierId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier?.id} value={supplier?.id || ''}>
                        {supplier?.name}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="in_transit">في الطريق</SelectItem>
                    <SelectItem value="arrived">وصلت</SelectItem>
                    <SelectItem value="customs">في الجمارك</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* التكاليف */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCost">
                  تكلفة الشحن {baseCurrency && `(${baseCurrency.symbol})`}
                </Label>
                <Input 
                  id="shippingCost" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData(prev => ({...prev, shippingCost: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customsFees">
                  رسوم الجمارك {baseCurrency && `(${baseCurrency.symbol})`}
                </Label>
                <Input 
                  id="customsFees" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.customsFees}
                  onChange={(e) => setFormData(prev => ({...prev, customsFees: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">
                  التأمين {baseCurrency && `(${baseCurrency.symbol})`}
                </Label>
                <Input 
                  id="insurance" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.insurance}
                  onChange={(e) => setFormData(prev => ({...prev, insurance: e.target.value}))}
                />
              </div>
            </div>

            {/* إضافة الأصناف */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">الأصناف في الشحنة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">الصنف</Label>
                  <Select value={itemForm.itemId} onValueChange={(value) => setItemForm(prev => ({...prev, itemId: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصنف" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item?.id} value={item?.id || ''}>
                          {item?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input 
                    id="quantity" 
                    type="number"
                    placeholder="0"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({...prev, quantity: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">الوزن (كجم)</Label>
                  <Input 
                    id="weight" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemForm.weight}
                    onChange={(e) => setItemForm(prev => ({...prev, weight: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">الحجم (م³)</Label>
                  <Input 
                    id="volume" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemForm.volume}
                    onChange={(e) => setItemForm(prev => ({...prev, volume: e.target.value}))}
                  />
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddItemToShipment}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة الصنف
              </Button>

              {/* قائمة الأصناف المضافة */}
              {formData.items.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">الأصناف المضافة:</h4>
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{getItemName(item.itemId)}</p>
                        <p className="text-sm text-gray-600">
                          الكمية: {item.quantity}
                          {item.weight && ` | الوزن: ${item.weight} كجم`}
                          {item.volume && ` | الحجم: ${item.volume} م³`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItemFromShipment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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