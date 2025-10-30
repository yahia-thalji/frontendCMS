import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { Supplier } from '@/types';
import { generateSupplierNumber } from '@/lib/autoNumber';
import { SupabaseSuppliersStorage } from '@/lib/supabaseStorage';

interface SuppliersProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Suppliers({ quickActionTrigger }: SuppliersProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    message: string;
    relatedEntities?: Array<{ type: string; count: number; items: string[] }>;
  } | null>(null);

  const [formData, setFormData] = useState({
    supplierNumber: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    country: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await SupabaseSuppliersStorage.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = SupabaseSuppliersStorage.subscribe((newSuppliers) => {
      setSuppliers(newSuppliers);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle quick action trigger
  useEffect(() => {
    if (quickActionTrigger?.action === 'add-supplier') {
      handleAddSupplier();
    }
  }, [quickActionTrigger]);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      supplierNumber: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      country: ''
    });
  };

  const handleAddSupplier = async () => {
    setEditingSupplier(null);
    resetForm();
    const supplierNumber = await generateSupplierNumber();
    setFormData(prev => ({
      ...prev,
      supplierNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplierNumber: supplier?.supplierNumber || '',
      name: supplier?.name || '',
      contactPerson: supplier?.contactPerson || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      address: supplier?.address || '',
      country: supplier?.country || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const supplierData = {
        supplierNumber: formData.supplierNumber,
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country
      };

      if (editingSupplier) {
        await SupabaseSuppliersStorage.update(editingSupplier.id, supplierData);
      } else {
        await SupabaseSuppliersStorage.add(supplierData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ المورد:', error);
      alert('حدث خطأ أثناء حفظ المورد');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      const result = await SupabaseSuppliersStorage.delete(supplierToDelete);
      
      if (result.success) {
        setDeleteDialogOpen(false);
        setSupplierToDelete(null);
        setDeleteError(null);
      } else {
        setDeleteError({
          message: result.message,
          relatedEntities: result.relatedEntities
        });
      }
    } catch (error) {
      console.error('خطأ في حذف المورد:', error);
      setDeleteError({
        message: 'حدث خطأ أثناء حذف المورد'
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
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
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
                <TableHead>الدولة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier?.id}>
                  <TableCell className="font-medium">{supplier?.supplierNumber || 'غير محدد'}</TableCell>
                  <TableCell className="font-medium">{supplier?.name || 'غير محدد'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 ml-1" />
                        {supplier?.phone || 'غير محدد'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 ml-1" />
                        {supplier?.email || 'غير محدد'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 ml-1" />
                      {supplier?.address || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>{supplier?.country || 'غير محدد'}</TableCell>
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
                        onClick={() => handleDeleteSupplier(supplier?.id || '')}
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
              <Label htmlFor="contactPerson">الشخص المسؤول</Label>
              <Input 
                id="contactPerson" 
                placeholder="أدخل اسم المسؤول"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({...prev, contactPerson: e.target.value}))}
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
              <Label htmlFor="country">الدولة</Label>
              <Input 
                id="country" 
                placeholder="أدخل الدولة"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({...prev, country: e.target.value}))}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 ml-2" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المورد؟
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

          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteError(null);
                setSupplierToDelete(null);
              }}
            >
              إلغاء
            </Button>
            {!deleteError && (
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
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