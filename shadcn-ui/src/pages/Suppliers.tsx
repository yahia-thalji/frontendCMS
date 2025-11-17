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
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
// import { useGetAllSuppliers, useAddSupplier, useUpdateSupplier, useDeleteSupplier, Supplier } from '../API/SuppliersAPI';
import { useGetAllSuppliers, useAddSupplier, useUpdateSupplier, useDeleteSupplier, Supplier } from '@/pages/API/SuppliersAPI';
import { toast } from 'sonner';

interface SuppliersProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Suppliers({ quickActionTrigger }: SuppliersProps) {
  const { 
    data: suppliersData, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useGetAllSuppliers();
  
  const addSupplierMutation = useAddSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    country: ''
  });

  const suppliers: Supplier[] = Array.isArray(suppliersData) ? suppliersData : [];

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-supplier') {
      handleAddSupplier();
    }
  }, [quickActionTrigger]);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      number: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      country: ''
    });
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    resetForm();
    // توليد رقم مورد تلقائي (يمكن استبداله بدالة توليد أرقام)
    const supplierNumber = `SUP-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      number: supplierNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      number: supplier.number,
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      country: supplier.country || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.email?.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // تحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    const supplierData = {
      number: formData.number,
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim() || undefined,
      country: formData.country.trim() || undefined
    };

    try {
      if (editingSupplier) {
        await updateSupplierMutation.mutateAsync({ 
          id: editingSupplier.id, 
          data: supplierData 
        });
      } else {
        await addSupplierMutation.mutateAsync(supplierData);
      }

      setIsDialogOpen(false);
      resetForm();
      setEditingSupplier(null);
    } catch (error) {
      console.error('خطأ في حفظ المورد:', error);
    }
  };

  const handleDeleteSupplier = (supplierId: number) => {
    setSupplierToDelete(supplierId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await deleteSupplierMutation.mutateAsync(supplierToDelete);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error('خطأ في حذف المورد:', error);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (isError) {
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
              {error instanceof Error ? error.message : 'تعذر تحميل بيانات الموردين'}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة الموردين</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة جميع الموردين وشركاء الأعمال</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRetry}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button 
            onClick={handleAddSupplier} 
            className="flex items-center justify-center flex-1 sm:flex-none"
            disabled={addSupplierMutation.isLoading}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مورد جديد
          </Button>
        </div>
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
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موردين محليين</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.country && s.country.includes('السعودية')).length}
            </div>
            <p className="text-xs text-gray-600">من السعودية</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موردين دوليين</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.country && !s.country.includes('السعودية')).length}
            </div>
            <p className="text-xs text-gray-600">من دول أخرى</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث بالاسم أو البريد الإلكتروني أو الرقم..."
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
            <Users className="h-5 w-5 ml-2" />
            قائمة الموردين ({filteredSuppliers.length})
          </CardTitle>
          <CardDescription className="text-sm">جميع الموردين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.number}</TableCell>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 ml-1 text-gray-500" />
                          {supplier.phone || 'غير محدد'}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 ml-1 text-gray-500" />
                          {supplier.email || 'غير محدد'}
                        </div>
                        {supplier.contactPerson && (
                          <div className="flex items-center text-sm">
                            <Users className="h-3 w-3 ml-1 text-gray-500" />
                            {supplier.contactPerson}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 ml-1 text-gray-500" />
                        {supplier.address || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.country || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        نشط
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                          disabled={updateSupplierMutation.isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteSupplierMutation.isLoading}
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
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {supplier.number}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 text-xs border-green-200">
                          نشط
                        </Badge>
                      </div>
                    </div>
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 ml-1 text-gray-500" />
                        <span className="text-gray-500 ml-2">الهاتف:</span>
                        <span className="font-medium mr-2">{supplier.phone || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 ml-1 text-gray-500" />
                        <span className="text-gray-500 ml-2">البريد:</span>
                        <span className="font-medium mr-2">{supplier.email || 'غير محدد'}</span>
                      </div>
                      {supplier.contactPerson && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 ml-1 text-gray-500" />
                          <span className="text-gray-500 ml-2">المسؤول:</span>
                          <span className="font-medium mr-2">{supplier.contactPerson}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 ml-1 text-gray-500" />
                        <span className="text-gray-500 ml-2">الدولة:</span>
                        <span className="font-medium mr-2">{supplier.country || 'غير محدد'}</span>
                      </div>
                      {supplier.address && (
                        <div className="flex items-start">
                          <MapPin className="h-3 w-3 ml-1 text-gray-500 mt-0.5" />
                          <span className="text-gray-500 ml-2">العنوان:</span>
                          <span className="font-medium mr-2 text-right flex-1">{supplier.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSupplier(supplier)}
                      className="flex-1"
                      disabled={updateSupplierMutation.isLoading}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                      disabled={deleteSupplierMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد موردين تطابق البحث' : 'لا توجد موردين مسجلين'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'تعديل بيانات المورد المحدد' : 'إضافة مورد جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierNumber">رقم المورد</Label>
              <Input 
                id="supplierNumber" 
                value={formData.number}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">اسم المورد <span className="text-red-600">*</span></Label>
              <Input 
                id="supplierName" 
                placeholder="أدخل اسم المورد"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">الشخص المسؤول</Label>
              <Input 
                id="contactPerson" 
                placeholder="أدخل اسم المسؤول"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({...prev, contactPerson: e.target.value}))}
                disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف <span className="text-red-600">*</span></Label>
              <Input 
                id="phone" 
                placeholder="أدخل رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني <span className="text-red-600">*</span></Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="أدخل البريد الإلكتروني"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">الدولة</Label>
              <Input 
                id="country" 
                placeholder="أدخل الدولة"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({...prev, country: e.target.value}))}
                disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea 
                id="address" 
                placeholder="أدخل العنوان الكامل"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveSupplier}
              className="w-full sm:w-auto"
              disabled={addSupplierMutation.isLoading || updateSupplierMutation.isLoading}
            >
              {addSupplierMutation.isLoading || updateSupplierMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingSupplier ? 'جاري التحديث...' : 'جاري الإضافة...'}
                </>
              ) : (
                editingSupplier ? 'حفظ التعديل' : 'إضافة المورد'
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
              هل أنت متأكد من حذف هذا المورد؟
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSupplierToDelete(null);
              }}
              className="w-full sm:w-auto"
              disabled={deleteSupplierMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="w-full sm:w-auto"
              disabled={deleteSupplierMutation.isLoading}
            >
              {deleteSupplierMutation.isLoading ? (
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