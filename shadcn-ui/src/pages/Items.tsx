import { useState } from 'react';
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
import { mockItems, mockSuppliers, mockLocations } from '@/data/mockData';
import { Item } from '@/types';
import { AutoNumberGenerator } from '@/lib/autoNumber';

export default function Items() {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'غير محدد';
    const location = mockLocations.find(l => l.id === locationId);
    return location?.name || 'غير محدد';
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

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
                placeholder="البحث بالاسم أو الرقم المرجعي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلتر حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="industrial">معدات صناعية</SelectItem>
                <SelectItem value="spare_parts">قطع غيار</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الأصناف */}
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
                <TableHead>النوع</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.referenceNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{getSupplierName(item.supplierId)}</TableCell>
                  <TableCell>{getLocationName(item.locationId)}</TableCell>
                  <TableCell>
                    <span className={item.quantity < 20 ? 'text-red-600 font-semibold' : ''}>
                      {item.quantity} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell>{item.price.toLocaleString('ar')} ريال</TableCell>
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
                        onClick={() => handleDeleteItem(item.id)}
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

      {/* نافذة إضافة/تعديل الصنف */}
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
              <Label htmlFor="name">اسم الصنف</Label>
              <Input id="name" placeholder="أدخل اسم الصنف" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">الرقم المرجعي</Label>
              <Input 
                id="reference" 
                value={editingItem?.referenceNumber || AutoNumberGenerator.generateItemNumber()}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">النوع</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industrial">معدات صناعية</SelectItem>
                  <SelectItem value="spare_parts">قطع غيار</SelectItem>
                  <SelectItem value="raw_materials">مواد خام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">المورد</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">السعر</Label>
              <Input id="price" type="number" placeholder="أدخل السعر" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">وحدة القياس</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="kg">كيلوجرام</SelectItem>
                  <SelectItem value="liter">لتر</SelectItem>
                  <SelectItem value="meter">متر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="specifications">المواصفات</Label>
              <Textarea id="specifications" placeholder="أدخل مواصفات الصنف" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {editingItem ? 'حفظ التعديل' : 'إضافة الصنف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}