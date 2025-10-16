import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import { mockSuppliers } from '@/data/mockData';
import { Supplier } from '@/types';
import { AutoNumberGenerator } from '@/lib/autoNumber';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // حالات النموذج
  const [formData, setFormData] = useState({
    supplierNumber: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: ''
  });

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      supplierNumber: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      paymentTerms: ''
    });
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    resetForm();
    setFormData(prev => ({
      ...prev,
      supplierNumber: AutoNumberGenerator.generateSupplierNumber()
    }));
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplierNumber: `SUP-2024-${supplier.id.padStart(4, '0')}`,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms
    });
    setIsDialogOpen(true);
  };

  const handleSaveSupplier = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier?.id || Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      paymentTerms: formData.paymentTerms,
      createdAt: editingSupplier?.createdAt || new Date()
    };

    if (editingSupplier) {
      setSuppliers(suppliers.map(supplier => 
        supplier.id === editingSupplier.id ? newSupplier : supplier
      ));
    } else {
      setSuppliers([...suppliers, newSupplier]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الموردين</h1>
          <p className="text-gray-600 mt-2">إدارة جميع الموردين وشركاء الأعمال</p>
        </div>
        <Button onClick={handleAddSupplier} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة مورد جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-gray-600">مورد نشط</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين الجدد</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-gray-600">هذا الشهر</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط مدة الدفع</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">37</div>
            <p className="text-xs text-gray-600">يوم</p>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول الموردين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 ml-2" />
            قائمة الموردين ({filteredSuppliers.length})
          </CardTitle>
          <CardDescription>جميع الموردين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم المورد</TableHead>
                <TableHead>اسم المورد</TableHead>
                <TableHead>معلومات الاتصال</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>شروط الدفع</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">SUP-2024-{supplier.id.padStart(4, '0')}</TableCell>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 ml-1" />
                        {supplier.phone}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 ml-1" />
                        {supplier.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 ml-1" />
                      {supplier.address}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.paymentTerms}</TableCell>
                  <TableCell>
                    {supplier.createdAt.toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600">
                      نشط
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier.id)}
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

      {/* نافذة إضافة/تعديل المورد */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'تعديل بيانات المورد المحدد' : 'إضافة مورد جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierNumber">رقم المورد</Label>
              <Input 
                id="supplierNumber" 
                value={formData.supplierNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">اسم المورد *</Label>
              <Input 
                id="supplierName" 
                placeholder="أدخل اسم المورد"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input 
                id="phone" 
                placeholder="أدخل رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="أدخل البريد الإلكتروني"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">شروط الدفع</Label>
              <Input 
                id="paymentTerms" 
                placeholder="مثال: 30 يوم"
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({...prev, paymentTerms: e.target.value}))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea 
                id="address" 
                placeholder="أدخل العنوان الكامل"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveSupplier}>
              {editingSupplier ? 'حفظ التعديل' : 'إضافة المورد'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}