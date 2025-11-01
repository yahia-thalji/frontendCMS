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
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Item, Location } from '@/types';
import { generateItemNumber } from '@/lib/autoNumber';
import { SupabaseItemsStorage, SupabaseLocationsStorage } from '@/lib/supabaseStorage';

interface ItemsProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Items({ quickActionTrigger }: ItemsProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    message: string;
    relatedEntities?: Array<{ type: string; count: number; items: string[] }>;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    itemNumber: '',
    description: '',
    quantity: '0',
    unit: '',
    price: '',
    costPrice: '',
    category: '',
    locationId: 'none'
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
      const [itemsData, locationsData] = await Promise.all([
        SupabaseItemsStorage.getAll(),
        SupabaseLocationsStorage.getAll()
      ]);
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

    const unsubscribeItems = SupabaseItemsStorage.subscribe((newItems) => {
      setItems(newItems);
    });

    const unsubscribeLocations = SupabaseLocationsStorage.subscribe((newLocations) => {
      setLocations(newLocations);
    });

    return () => {
      unsubscribeItems();
      unsubscribeLocations();
    };
  }, []);

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-item') {
      handleAddItem();
    }
  }, [quickActionTrigger]);

  const filteredItems = items.filter(item =>
    item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item?.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'غير محدد';
    const location = locations.find(l => l?.id === locationId);
    return location?.name || 'غير محدد';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      itemNumber: '',
      description: '',
      quantity: '0',
      unit: '',
      price: '',
      costPrice: '',
      category: '',
      locationId: 'none'
    });
  };

  const handleAddItem = async () => {
    setEditingItem(null);
    resetForm();
    const itemNumber = await generateItemNumber();
    setFormData(prev => ({
      ...prev,
      itemNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item?.name || '',
      itemNumber: item?.itemNumber || '',
      description: item?.description || '',
      quantity: (item?.quantity || 0).toString(),
      unit: item?.unit || '',
      price: (item?.price || 0).toString(),
      costPrice: (item?.costPrice || 0).toString(),
      category: item?.category || '',
      locationId: item?.locationId || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) {
      alert('يرجى ملء جميع الحقول المطلوبة (الاسم والسعر)');
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        itemNumber: formData.itemNumber,
        description: formData.description,
        quantity: parseInt(formData.quantity) || 0,
        unit: formData.unit,
        price: parseFloat(formData.price) || 0,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        category: formData.category,
        locationId: formData.locationId === 'none' ? undefined : formData.locationId
      };

      if (editingItem) {
        await SupabaseItemsStorage.update(editingItem.id, itemData);
      } else {
        await SupabaseItemsStorage.add(itemData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ الصنف:', error);
      alert('حدث خطأ أثناء حفظ الصنف');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const result = await SupabaseItemsStorage.delete(itemToDelete);
      
      if (result.success) {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        setDeleteError(null);
      } else {
        setDeleteError({
          message: result.message,
          relatedEntities: result.relatedEntities
        });
      }
    } catch (error) {
      console.error('خطأ في حذف الصنف:', error);
      setDeleteError({
        message: 'حدث خطأ أثناء حذف الصنف'
      });
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة الأصناف</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة جميع الأصناف والمنتجات المستوردة</p>
        </div>
        <Button onClick={handleAddItem} className="w-full sm:w-auto flex items-center justify-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة صنف جديد
        </Button>
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
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item?.id || Math.random()}>
                    <TableCell className="font-medium">{item?.name || 'غير محدد'}</TableCell>
                    <TableCell>{item?.itemNumber || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item?.category || 'غير محدد'}</Badge>
                    </TableCell>
                    <TableCell>{getLocationName(item?.locationId)}</TableCell>
                    <TableCell>
                      <span className={(item?.quantity || 0) < 20 ? 'text-red-600 font-semibold' : ''}>
                        {item?.quantity || 0} {item?.unit || ''}
                      </span>
                    </TableCell>
                    <TableCell>{safeToLocaleString(item?.costPrice)} ريال</TableCell>
                    <TableCell className="font-semibold">{safeToLocaleString(item?.price)} ريال</TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item?.id || '')}
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredItems.map((item) => (
              <Card key={item?.id || Math.random()} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item?.name || 'غير محدد'}</h3>
                      <p className="text-sm text-gray-500">{item?.itemNumber || 'غير محدد'}</p>
                    </div>
                    <Badge variant="outline">{item?.category || 'غير محدد'}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">الموقع:</span>
                      <p className="font-medium">{getLocationName(item?.locationId)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">الكمية:</span>
                      <p className={(item?.quantity || 0) < 20 ? 'text-red-600 font-semibold' : 'font-medium'}>
                        {item?.quantity || 0} {item?.unit || ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">سعر التكلفة:</span>
                      <p className="font-medium">{safeToLocaleString(item?.costPrice)} ريال</p>
                    </div>
                    <div>
                      <span className="text-gray-500">السعر:</span>
                      <p className="font-medium text-lg">{safeToLocaleString(item?.price)} ريال</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item?.id || '')}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الصنف *</Label>
              <Input 
                id="name" 
                placeholder="أدخل اسم الصنف"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemNumber">الرقم المرجعي</Label>
              <Input 
                id="itemNumber" 
                value={formData.itemNumber}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">الموقع (اختياري)</Label>
              <Select value={formData.locationId} onValueChange={(value) => setFormData(prev => ({...prev, locationId: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموقع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون موقع</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location?.id} value={location?.id || ''}>
                      {location?.name || 'غير محدد'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">سعر التكلفة (اختياري)</Label>
              <Input 
                id="costPrice" 
                type="number" 
                placeholder="أدخل سعر التكلفة"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({...prev, costPrice: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">السعر *</Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="أدخل السعر"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">وحدة القياس</Label>
              <Input 
                id="unit" 
                placeholder="مثال: قطعة، كجم"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({...prev, unit: e.target.value}))}
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
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea 
                id="description" 
                placeholder="أدخل وصف الصنف"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              إلغاء
            </Button>
            <Button onClick={handleSaveItem} className="w-full sm:w-auto">
              {editingItem ? 'حفظ التعديل' : 'إضافة الصنف'}
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
          
          {deleteError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>لا يمكن الحذف</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{deleteError.message}</p>
                {deleteError.relatedEntities && deleteError.relatedEntities.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {deleteError.relatedEntities.map((entity, index) => (
                      <div key={index} className="bg-red-50 p-3 rounded">
                        <p className="font-semibold text-sm mb-1">
                          {entity.type} ({entity.count})
                        </p>
                        <ul className="text-xs space-y-1">
                          {entity.items.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                          {entity.count > 5 && (
                            <li className="text-gray-600">... و {entity.count - 5} أخرى</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteError(null);
                setItemToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>
            {!deleteError && (
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                className="w-full sm:w-auto"
              >
                تأكيد الحذف
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}