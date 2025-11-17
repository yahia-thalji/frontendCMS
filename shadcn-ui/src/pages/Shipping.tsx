import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Ship, Calendar, Package, DollarSign, X, RefreshCw } from 'lucide-react';
import { useGetAllShipments, useAddShipment, useUpdateShipment, useDeleteShipment, Shipment, ShipmentItem } from '@/pages/API/ShippingAPI';
// import { useGetAllSuppliers, Supplier } from './SuppliersAPI';
import { useGetAllSuppliers, Supplier } from '@/pages/API/SuppliersAPI';
import { useGetAllItems, Item } from '@/pages/API/ItemsAPI';
import { useGetAllCurrencies } from '@/pages/API/CurrenciesAPI';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShippingProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Shipping({ quickActionTrigger }: ShippingProps) {
  const isMobile = useIsMobile();
  
  // APIs
  const { 
    data: shipmentsData, 
    isLoading: shipmentsLoading, 
    error: shipmentsError, 
    refetch: refetchShipments,
    isError: shipmentsIsError 
  } = useGetAllShipments();
  
  const { 
    data: suppliersData, 
    isLoading: suppliersLoading 
  } = useGetAllSuppliers();
  
  const { 
    data: itemsData, 
    isLoading: itemsLoading 
  } = useGetAllItems();
  
  const { 
    data: currenciesData 
  } = useGetAllCurrencies();

  const addShipmentMutation = useAddShipment();
  const updateShipmentMutation = useUpdateShipment();
  const deleteShipmentMutation = useDeleteShipment();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

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
    currencyId: '',
    items: [] as ShipmentItem[]
  });

  // Item form for adding items to shipment
  const [itemForm, setItemForm] = useState({
    itemId: '',
    quantity: '',
    weight: '',
    volume: ''
  });

  // Data
  const shipments: Shipment[] = Array.isArray(shipmentsData) ? shipmentsData : [];
  const suppliers: Supplier[] = Array.isArray(suppliersData) ? suppliersData : [];
  const items: Item[] = Array.isArray(itemsData) ? itemsData : [];
  const currencies = Array.isArray(currenciesData) ? currenciesData : [];
  const baseCurrency = currencies.find(c => c.isBase);

  const loading = shipmentsLoading || suppliersLoading || itemsLoading;

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
    const supplier = suppliers.find(s => s.id.toString() === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getItemName = (itemId: string) => {
    if (!itemId) return 'غير محدد';
    const item = items.find(i => i.id.toString() === itemId);
    return item?.name || 'غير محدد';
  };

  const formatPrice = (amount: number): string => {
    if (!baseCurrency) return amount.toString();
    return `${amount.toLocaleString('ar')} ${baseCurrency.symbol}`;
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
      currencyId: baseCurrency?.id.toString() || '',
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
      containerNumber: shipment.containerNumber,
      billOfLading: shipment.billOfLading,
      supplierId: shipment.supplierId,
      departureDate: shipment.departureDate,
      arrivalDate: shipment.arrivalDate || '',
      status: shipment.status,
      shippingCost: shipment.shippingCost.toString(),
      customsFees: shipment.customsFees.toString(),
      insurance: shipment.insurance?.toString() || '',
      currencyId: shipment.currencyId?.toString() || baseCurrency?.id.toString() || '',
      items: shipment.items
    });
    setIsDialogOpen(true);
  };

  const handleAddItemToShipment = () => {
    if (!itemForm.itemId || !itemForm.quantity) {
      toast.error('يرجى اختيار الصنف وإدخال الكمية');
      return;
    }

    const quantity = parseInt(itemForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('يرجى إدخال كمية صحيحة');
      return;
    }

    const newItem: ShipmentItem = {
      itemId: itemForm.itemId,
      quantity: quantity,
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
    if (!formData.containerNumber?.trim() || !formData.billOfLading?.trim() || !formData.supplierId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('يرجى إضافة صنف واحد على الأقل إلى الشحنة');
      return;
    }

    const shippingCost = parseFloat(formData.shippingCost) || 0;
    const customsFees = parseFloat(formData.customsFees) || 0;
    const insurance = formData.insurance ? parseFloat(formData.insurance) : undefined;

    if (shippingCost < 0 || customsFees < 0 || (insurance && insurance < 0)) {
      toast.error('يرجى إدخال قيم تكاليف صحيحة');
      return;
    }

    const shipmentData = {
      containerNumber: formData.containerNumber.trim(),
      billOfLading: formData.billOfLading.trim(),
      supplierId: formData.supplierId,
      departureDate: formData.departureDate,
      arrivalDate: formData.arrivalDate || undefined,
      status: formData.status,
      shippingCost,
      customsFees,
      insurance,
      currencyId: formData.currencyId ? parseInt(formData.currencyId) : undefined,
      items: formData.items
    };

    try {
      if (editingShipment) {
        await updateShipmentMutation.mutateAsync({ 
          id: editingShipment.id, 
          data: shipmentData 
        });
      } else {
        await addShipmentMutation.mutateAsync(shipmentData);
      }

      setIsDialogOpen(false);
      resetForm();
      setEditingShipment(null);
    } catch (error) {
      console.error('خطأ في حفظ الشحنة:', error);
    }
  };

  const handleDeleteShipment = async (shipmentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشحنة؟')) return;

    try {
      await deleteShipmentMutation.mutateAsync(shipmentId);
    } catch (error) {
      console.error('خطأ في حذف الشحنة:', error);
    }
  };

  const handleRetry = () => {
    refetchShipments();
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
    const shipping = shipment.shippingCost || 0;
    const customs = shipment.customsFees || 0;
    const insurance = shipment.insurance || 0;
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

  if (shipmentsIsError) {
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
              {shipmentsError instanceof Error ? shipmentsError.message : 'تعذر تحميل بيانات الشحنات'}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة الشحن</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة جميع الشحنات والحاويات</p>
          {baseCurrency && (
            <p className="text-xs text-gray-500 mt-1">جميع التكاليف بـ {baseCurrency.name} ({baseCurrency.symbol})</p>
          )}
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
            onClick={handleAddShipment} 
            className="flex items-center justify-center flex-1 sm:flex-none"
            disabled={addShipmentMutation.isLoading}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة شحنة جديدة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
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
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center text-lg md:text-xl">
            <Ship className="h-5 w-5 ml-2" />
            قائمة الشحنات ({filteredShipments.length})
          </CardTitle>
          <CardDescription className="text-sm">جميع الشحنات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {isMobile ? (
            <div className="space-y-4 p-4">
              {filteredShipments.map((shipment) => (
                <Card key={shipment.id} className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{shipment.containerNumber}</p>
                        <p className="text-sm text-gray-600">{shipment.billOfLading}</p>
                      </div>
                      {getStatusBadge(shipment.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">المورد</p>
                        <p className="font-medium">{getSupplierName(shipment.supplierId)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                        <span className="text-gray-500 ml-2">المغادرة:</span>
                        <span className="font-medium mr-2">{shipment.departureDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                        <span className="text-gray-500 ml-2">الوصول:</span>
                        <span className="font-medium mr-2">{shipment.arrivalDate || 'غير محدد'}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <DollarSign className="h-3 w-3 ml-1 text-gray-500" />
                      <span className="text-gray-500 ml-2">التكلفة:</span>
                      <span className="font-medium mr-2">{formatPrice(calculateTotalCost(shipment))}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Package className="h-3 w-3 ml-1 text-gray-500" />
                      <span className="text-gray-500 ml-2">الأصناف:</span>
                      <span className="font-medium mr-2">{shipment.items.length}</span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditShipment(shipment)}
                        className="flex-1"
                        disabled={updateShipmentMutation.isLoading}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteShipment(shipment.id)}
                        className="flex-1 text-red-600 hover:text-red-700"
                        disabled={deleteShipmentMutation.isLoading}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
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
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.containerNumber}</TableCell>
                      <TableCell>{shipment.billOfLading}</TableCell>
                      <TableCell>{getSupplierName(shipment.supplierId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                          {shipment.departureDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                          {shipment.arrivalDate || 'غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 ml-1 text-gray-500" />
                          {formatPrice(calculateTotalCost(shipment))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="h-3 w-3 ml-1 text-gray-500" />
                          {shipment.items.length}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShipment(shipment)}
                            disabled={updateShipmentMutation.isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteShipment(shipment.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleteShipmentMutation.isLoading}
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

          {filteredShipments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد شحنات تطابق البحث' : 'لا توجد شحنات مسجلة'}
              </p>
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
                <Label htmlFor="containerNumber">رقم الحاوية <span className="text-red-600">*</span></Label>
                <Input 
                  id="containerNumber" 
                  placeholder="أدخل رقم الحاوية"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData(prev => ({...prev, containerNumber: e.target.value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billOfLading">بوليصة الشحن <span className="text-red-600">*</span></Label>
                <Input 
                  id="billOfLading" 
                  placeholder="أدخل رقم بوليصة الشحن"
                  value={formData.billOfLading}
                  onChange={(e) => setFormData(prev => ({...prev, billOfLading: e.target.value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد <span className="text-red-600">*</span></Label>
                <Select 
                  value={formData.supplierId} 
                  onValueChange={(value) => setFormData(prev => ({...prev, supplierId: value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureDate">تاريخ المغادرة <span className="text-red-600">*</span></Label>
                <Input 
                  id="departureDate" 
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData(prev => ({...prev, departureDate: e.target.value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalDate">تاريخ الوصول</Label>
                <Input 
                  id="arrivalDate" 
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData(prev => ({...prev, arrivalDate: e.target.value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة <span className="text-red-600">*</span></Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: Shipment['status']) => setFormData(prev => ({...prev, status: value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                >
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
                  تكلفة الشحن {baseCurrency && `(${baseCurrency.symbol})`} <span className="text-red-600">*</span>
                </Label>
                <Input 
                  id="shippingCost" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData(prev => ({...prev, shippingCost: e.target.value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customsFees">
                  رسوم الجمارك {baseCurrency && `(${baseCurrency.symbol})`} <span className="text-red-600">*</span>
                </Label>
                <Input 
                  id="customsFees" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.customsFees}
                  onChange={(e) => setFormData(prev => ({...prev, customsFees: e.target.value}))}
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
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
                  disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                />
              </div>
            </div>

            {/* إضافة الأصناف */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">الأصناف في الشحنة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">الصنف <span className="text-red-600">*</span></Label>
                  <Select 
                    value={itemForm.itemId} 
                    onValueChange={(value) => setItemForm(prev => ({...prev, itemId: value}))}
                    disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصنف" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية <span className="text-red-600">*</span></Label>
                  <Input 
                    id="quantity" 
                    type="number"
                    placeholder="0"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({...prev, quantity: e.target.value}))}
                    disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
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
                    disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
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
                    disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                  />
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddItemToShipment}
                className="w-full md:w-auto"
                disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
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
                        disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveShipment}
              className="w-full sm:w-auto"
              disabled={addShipmentMutation.isLoading || updateShipmentMutation.isLoading}
            >
              {addShipmentMutation.isLoading || updateShipmentMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingShipment ? 'جاري التحديث...' : 'جاري الإضافة...'}
                </>
              ) : (
                editingShipment ? 'حفظ التعديل' : 'إضافة الشحنة'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}