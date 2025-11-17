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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
// import { useGetAllItems, useAddItem, useUpdateItem, useDeleteItem, Item } from './ItemsAPI';
import { useGetAllItems, useAddItem, useUpdateItem, useDeleteItem, Item } from '@/pages/API/ItemsAPI';
import { useGetAllLocations, Location } from '@/pages/API/LocationsAPI';
import { useGetAllCurrencies } from '@/pages/API/CurrenciesAPI';
import { toast } from 'sonner';

interface ItemsProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Items({ quickActionTrigger }: ItemsProps) {
  // APIs
  const { 
    data: itemsData, 
    isLoading: itemsLoading, 
    error: itemsError, 
    refetch: refetchItems,
    isError: itemsIsError 
  } = useGetAllItems();
  
  const { 
    data: locationsData, 
    isLoading: locationsLoading 
  } = useGetAllLocations();
  
  const { 
    data: currenciesData 
  } = useGetAllCurrencies();

  const addItemMutation = useAddItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    name: '',
    description: '',
    quantity: '0',
    unit: '',
    price: '',
    costPrice: '',
    category: '',
    locationId: '',
    currencyId: ''
  });

  // Data
  const items: Item[] = Array.isArray(itemsData) ? itemsData : [];
  const locations: Location[] = Array.isArray(locationsData) ? locationsData : [];
  const currencies = Array.isArray(currenciesData) ? currenciesData : [];
  const baseCurrency = currencies.find(c => c.isBase);

  const loading = itemsLoading || locationsLoading;

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-item') {
      handleAddItem();
    }
  }, [quickActionTrigger]);

  const filteredItems = items.filter(item =>
    item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item?.number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationName = (locationId?: number) => {
    if (!locationId) return 'غير محدد';
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'غير محدد';
  };

  const formatPrice = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return baseCurrency ? `0 ${baseCurrency.symbol}` : '0';
    }
    return `${amount.toLocaleString('ar')} ${baseCurrency?.symbol || ''}`;
  };

  const calculateProfitMetrics = (price: number, costPrice?: number) => {
    if (!costPrice || costPrice === 0) {
      return { profitMargin: undefined, profitAmount: undefined };
    }
    
    const profitAmount = price - costPrice;
    const profitMargin = (profitAmount / costPrice) * 100;
    
    return {
      profitMargin: Math.round(profitMargin * 100) / 100,
      profitAmount: Math.round(profitAmount * 100) / 100
    };
  };

  const getProfitColor = (profitMargin?: number | null) => {
    if (profitMargin === undefined || profitMargin === null) return 'text-gray-500';
    if (profitMargin >= 30) return 'text-green-600';
    if (profitMargin >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProfitBadgeVariant = (profitMargin?: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (profitMargin === undefined || profitMargin === null) return 'outline';
    if (profitMargin >= 30) return 'default';
    if (profitMargin >= 15) return 'secondary';
    return 'destructive';
  };

  const resetForm = () => {
    setFormData({
      number: '',
      name: '',
      description: '',
      quantity: '0',
      unit: '',
      price: '',
      costPrice: '',
      category: '',
      locationId: '',
      currencyId: baseCurrency?.id.toString() || ''
    });
  };

  const handleAddItem = () => {
    setEditingItem(null);
    resetForm();
    // توليد رقم صنف تلقائي (يمكن استبداله بدالة توليد أرقام)
    const itemNumber = `ITEM-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      number: itemNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      number: item.number,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity.toString(),
      unit: item.unit,
      price: item.price.toString(),
      costPrice: item.costPrice?.toString() || '',
      category: item.category || '',
      locationId: item.locationId?.toString() || '',
      currencyId: item.currencyId?.toString() || baseCurrency?.id.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name?.trim() || !formData.price) {
      toast.error('يرجى ملء جميع الحقول المطلوبة (الاسم والسعر)');
      return;
    }

    const price = parseFloat(formData.price);
    const costPrice = formData.costPrice ? parseFloat(formData.costPrice) : undefined;
    const quantity = parseInt(formData.quantity) || 0;

    if (isNaN(price) || price < 0) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }

    if (costPrice && (isNaN(costPrice) || costPrice < 0)) {
      toast.error('يرجى إدخال سعر تكلفة صحيح');
      return;
    }

    if (quantity < 0) {
      toast.error('يرجى إدخال كمية صحيحة');
      return;
    }

    const { profitMargin, profitAmount } = calculateProfitMetrics(price, costPrice);

    const itemData = {
      number: formData.number,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      quantity,
      unit: formData.unit.trim(),
      price,
      costPrice,
      profitMargin,
      profitAmount,
      category: formData.category.trim() || undefined,
      locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
      currencyId: formData.currencyId ? parseInt(formData.currencyId) : undefined
    };

    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({ 
          id: editingItem.id, 
          data: itemData 
        });
      } else {
        await addItemMutation.mutateAsync(itemData);
      }

      setIsDialogOpen(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      console.error('خطأ في حفظ الصنف:', error);
    }
  };

  const handleDeleteItem = (itemId: number) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItemMutation.mutateAsync(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('خطأ في حذف الصنف:', error);
    }
  };

  const handleRetry = () => {
    refetchItems();
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

  if (itemsIsError) {
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
              {itemsError instanceof Error ? itemsError.message : 'تعذر تحميل بيانات الأصناف'}
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة الأصناف</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة جميع الأصناف والمنتجات المستوردة</p>
          {baseCurrency && (
            <p className="text-xs text-gray-500 mt-1">جميع الأسعار بـ {baseCurrency.name} ({baseCurrency.symbol})</p>
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
            onClick={handleAddItem} 
            className="flex items-center justify-center flex-1 sm:flex-none"
            disabled={addItemMutation.isLoading}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة صنف جديد
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
              placeholder="البحث بالاسم أو الرقم المرجعي..."
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
            <Package className="h-5 w-5 ml-2" />
            قائمة الأصناف ({filteredItems.length})
          </CardTitle>
          <CardDescription className="text-sm">جميع الأصناف المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الرقم المرجعي</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>سعر التكلفة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>هامش الربح</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category || 'غير محدد'}</Badge>
                    </TableCell>
                    <TableCell>{getLocationName(item.locationId)}</TableCell>
                    <TableCell>
                      <span className={item.quantity < 20 ? 'text-red-600 font-semibold' : ''}>
                        {item.quantity} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(item.costPrice)}</TableCell>
                    <TableCell className="font-semibold">{formatPrice(item.price)}</TableCell>
                    <TableCell>
                      {item.profitMargin !== undefined && item.profitMargin !== null ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant={getProfitBadgeVariant(item.profitMargin)} className="w-fit">
                            <TrendingUp className="h-3 w-3 ml-1" />
                            {Number(item.profitMargin).toFixed(1)}%
                          </Badge>
                          <span className={`text-xs ${getProfitColor(item.profitMargin)}`}>
                            {formatPrice(item.profitAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          disabled={updateItemMutation.isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteItemMutation.isLoading}
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.number}</p>
                    </div>
                    <Badge variant="outline">{item.category || 'غير محدد'}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">الموقع:</span>
                      <p className="font-medium">{getLocationName(item.locationId)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">الكمية:</span>
                      <p className={item.quantity < 20 ? 'text-red-600 font-semibold' : 'font-medium'}>
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">سعر التكلفة:</span>
                      <p className="font-medium">{formatPrice(item.costPrice)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">السعر:</span>
                      <p className="font-medium text-lg">{formatPrice(item.price)}</p>
                    </div>
                  </div>

                  {item.profitMargin !== undefined && item.profitMargin !== null && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-500 text-sm">هامش الربح:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getProfitBadgeVariant(item.profitMargin)}>
                          <TrendingUp className="h-3 w-3 ml-1" />
                          {Number(item.profitMargin).toFixed(1)}%
                        </Badge>
                        <span className={`text-sm font-medium ${getProfitColor(item.profitMargin)}`}>
                          ({formatPrice(item.profitAmount)})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="flex-1"
                      disabled={updateItemMutation.isLoading}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                      disabled={deleteItemMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد أصناف تطابق البحث' : 'لا توجد أصناف مسجلة'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'تعديل بيانات الصنف المحدد' : 'إضافة صنف جديد إلى النظام'}
              {baseCurrency && (
                <span className="block mt-1 text-xs">الأسعار بـ {baseCurrency.name} ({baseCurrency.symbol})</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الصنف <span className="text-red-600">*</span></Label>
              <Input 
                id="name" 
                placeholder="أدخل اسم الصنف"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">الرقم المرجعي</Label>
              <Input 
                id="number" 
                value={formData.number}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Input 
                id="category" 
                placeholder="أدخل الفئة"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">الموقع (اختياري)</Label>
              <Select
  value={formData.locationId}
  onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
>
  <SelectTrigger>
    <SelectValue placeholder="اختر الموقع" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">بدون موقع</SelectItem>
    {locations.map((location) => (
      <SelectItem key={location.id} value={location.id.toString()}>
        {location.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">
                سعر التكلفة (اختياري) {baseCurrency && `(${baseCurrency.symbol})`}
              </Label>
              <Input 
                id="costPrice" 
                type="number" 
                step="0.01"
                placeholder="أدخل سعر التكلفة"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({...prev, costPrice: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">
                السعر <span className="text-red-600">*</span> {baseCurrency && `(${baseCurrency.symbol})`}
              </Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                placeholder="أدخل السعر"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
            
            {formData.price && formData.costPrice && (
              <div className="col-span-1 md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">معاينة هامش الربح</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">مبلغ الربح:</span>
                    <p className="font-semibold text-lg text-blue-700">
                      {formatPrice(parseFloat(formData.price) - parseFloat(formData.costPrice))}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">نسبة الربح:</span>
                    <p className="font-semibold text-lg text-blue-700">
                      {(((parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.costPrice)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unit">وحدة القياس</Label>
              <Input 
                id="unit" 
                placeholder="مثال: قطعة، كجم"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({...prev, unit: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <Input 
                id="quantity" 
                type="number" 
                placeholder="أدخل الكمية"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({...prev, quantity: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea 
                id="description" 
                placeholder="أدخل وصف الصنف"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveItem}
              className="w-full sm:w-auto"
              disabled={addItemMutation.isLoading || updateItemMutation.isLoading}
            >
              {addItemMutation.isLoading || updateItemMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingItem ? 'جاري التحديث...' : 'جاري الإضافة...'}
                </>
              ) : (
                editingItem ? 'حفظ التعديل' : 'إضافة الصنف'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 ml-2" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا الصنف؟
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              className="w-full sm:w-auto"
              disabled={deleteItemMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="w-full sm:w-auto"
              disabled={deleteItemMutation.isLoading}
            >
              {deleteItemMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الحذف...
                </>
              ) : (
                'تأكيد الحذف'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}