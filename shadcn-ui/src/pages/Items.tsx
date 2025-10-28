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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Item, Supplier, Location } from '@/types';
import { generateItemNumber } from '@/lib/autoNumber';
import { SupabaseItemsStorage, SupabaseSuppliersStorage, SupabaseLocationsStorage } from '@/lib/supabaseStorage';

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    itemNumber: '',
    description: '',
    supplierId: '',
    quantity: '0',
    unit: '',
    price: '',
    category: ''
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
      const [itemsData, suppliersData, locationsData] = await Promise.all([
        SupabaseItemsStorage.getAll(),
        SupabaseSuppliersStorage.getAll(),
        SupabaseLocationsStorage.getAll()
      ]);
      setItems(itemsData);
      setSuppliers(suppliersData);
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

    const unsubscribeSuppliers = SupabaseSuppliersStorage.subscribe((newSuppliers) => {
      setSuppliers(newSuppliers);
    });

    const unsubscribeLocations = SupabaseLocationsStorage.subscribe((newLocations) => {
      setLocations(newLocations);
    });

    return () => {
      unsubscribeItems();
      unsubscribeSuppliers();
      unsubscribeLocations();
    };
  }, []);

  const filteredItems = items.filter(item =>
    item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item?.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    if (!supplierId) return 'غير محدد';
    const supplier = suppliers.find(s => s?.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      itemNumber: '',
      description: '',
      supplierId: '',
      quantity: '0',
      unit: '',
      price: '',
      category: ''
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
      supplierId: item?.supplierId || '',
      quantity: (item?.quantity || 0).toString(),
      unit: item?.unit || '',
      price: (item?.price || 0).toString(),
      category: item?.category || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.supplierId || !formData.price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        itemNumber: formData.itemNumber,
        description: formData.description,
        supplierId: formData.supplierId,
        quantity: parseInt(formData.quantity) || 0,
        unit: formData.unit,
        price: parseFloat(formData.price) || 0,
        category: formData.category
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
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      try {
        await SupabaseItemsStorage.delete(itemId);
      } catch (error) {
        console.error('خطأ في حذف الصنف:', error);
        alert('حدث خطأ أثناء حذف الصنف');
      }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأصناف</h1>
          <p className="text-gray-600 mt-2">إدارة جميع الأصناف والمنتجات المستوردة</p>
        </div>
        <Button onClick={handleAddItem} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة صنف جديد
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
                placeholder="البحث بالاسم أو الرقم المرجعي..."
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
            <Package className="h-5 w-5 ml-2" />
            قائمة الأصناف ({filteredItems.length})
          </CardTitle>
          <CardDescription>جميع الأصناف المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الرقم المرجعي</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الكمية</TableHead>
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
                  <TableCell>{getSupplierName(item?.supplierId || '')}</TableCell>
                  <TableCell>
                    <span className={(item?.quantity || 0) < 20 ? 'text-red-600 font-semibold' : ''}>
                      {item?.quantity || 0} {item?.unit || ''}
                    </span>
                  </TableCell>
                  <TableCell>{safeToLocaleString(item?.price)} ريال</TableCell>
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'تعديل بيانات الصنف المحدد' : 'إضافة صنف جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="category">الفئة *</Label>
              <Input 
                id="category" 
                placeholder="أدخل الفئة"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
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
                      {supplier?.name || 'غير محدد'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="unit">وحدة القياس *</Label>
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
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea 
                id="description" 
                placeholder="أدخل وصف الصنف"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'حفظ التعديل' : 'إضافة الصنف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}