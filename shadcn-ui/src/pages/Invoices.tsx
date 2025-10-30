import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, FileText, Calendar } from 'lucide-react';
import { Invoice, Supplier, Item } from '@/types';
import { generateInvoiceNumber } from '@/lib/autoNumber';
import { SupabaseInvoicesStorage, SupabaseSuppliersStorage, SupabaseItemsStorage } from '@/lib/supabaseStorage';

interface InvoicesProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Invoices({ quickActionTrigger }: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    itemId: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as Invoice['status']
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, suppliersData, itemsData] = await Promise.all([
        SupabaseInvoicesStorage.getAll(),
        SupabaseSuppliersStorage.getAll(),
        SupabaseItemsStorage.getAll()
      ]);
      setInvoices(invoicesData);
      setSuppliers(suppliersData);
      setItems(itemsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribeInvoices = SupabaseInvoicesStorage.subscribe((newInvoices) => {
      setInvoices(newInvoices);
    });

    const unsubscribeSuppliers = SupabaseSuppliersStorage.subscribe((newSuppliers) => {
      setSuppliers(newSuppliers);
    });

    const unsubscribeItems = SupabaseItemsStorage.subscribe((newItems) => {
      setItems(newItems);
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeSuppliers();
      unsubscribeItems();
    };
  }, []);

  // Handle quick action trigger
  useEffect(() => {
    if (quickActionTrigger?.action === 'add-invoice') {
      handleAddInvoice();
    }
  }, [quickActionTrigger]);

  const filteredInvoices = invoices.filter(invoice =>
    invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
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
      invoiceNumber: '',
      supplierId: '',
      itemId: '',
      quantity: '',
      unitPrice: '',
      totalAmount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
  };

  const handleAddInvoice = async () => {
    setEditingInvoice(null);
    resetForm();
    const invoiceNumber = await generateInvoiceNumber();
    setFormData(prev => ({
      ...prev,
      invoiceNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice?.invoiceNumber || '',
      supplierId: invoice?.supplierId || '',
      itemId: invoice?.itemId || '',
      quantity: (invoice?.quantity || 0).toString(),
      unitPrice: (invoice?.unitPrice || 0).toString(),
      totalAmount: (invoice?.totalAmount || 0).toString(),
      date: invoice?.date || new Date().toISOString().split('T')[0],
      status: invoice?.status || 'pending'
    });
    setIsDialogOpen(true);
  };

  const handleSaveInvoice = async () => {
    if (!formData.supplierId || !formData.itemId || !formData.quantity || !formData.unitPrice) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const quantity = parseInt(formData.quantity) || 0;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const totalAmount = quantity * unitPrice;

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        supplierId: formData.supplierId,
        itemId: formData.itemId,
        quantity,
        unitPrice,
        totalAmount,
        date: formData.date,
        status: formData.status
      };

      if (editingInvoice) {
        await SupabaseInvoicesStorage.update(editingInvoice.id, invoiceData);
      } else {
        await SupabaseInvoicesStorage.add(invoiceData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ الفاتورة:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await SupabaseInvoicesStorage.delete(invoiceId);
      } catch (error) {
        console.error('خطأ في حذف الفاتورة:', error);
        alert('حدث خطأ أثناء حذف الفاتورة');
      }
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'مدفوعة', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ملغاة', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  useEffect(() => {
    if (formData.quantity && formData.unitPrice) {
      const quantity = parseInt(formData.quantity) || 0;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const total = quantity * unitPrice;
      setFormData(prev => ({
        ...prev,
        totalAmount: total.toString()
      }));
    }
  }, [formData.quantity, formData.unitPrice]);

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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الفواتير</h1>
          <p className="text-gray-600 mt-2">إدارة جميع فواتير الشراء والمدفوعات</p>
        </div>
        <Button onClick={handleAddInvoice} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة فاتورة جديدة
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
                placeholder="البحث برقم الفاتورة..."
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
            <FileText className="h-5 w-5 ml-2" />
            قائمة الفواتير ({filteredInvoices.length})
          </CardTitle>
          <CardDescription>جميع الفواتير المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الصنف</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>سعر الوحدة</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice?.id}>
                  <TableCell className="font-medium">{invoice?.invoiceNumber || 'غير محدد'}</TableCell>
                  <TableCell>{getSupplierName(invoice?.supplierId || '')}</TableCell>
                  <TableCell>{getItemName(invoice?.itemId || '')}</TableCell>
                  <TableCell>{invoice?.quantity || 0}</TableCell>
                  <TableCell>{(invoice?.unitPrice || 0).toLocaleString('ar')} ريال</TableCell>
                  <TableCell className="font-semibold">{(invoice?.totalAmount || 0).toLocaleString('ar')} ريال</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 ml-1" />
                      {invoice?.date || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice?.status || 'pending')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvoice(invoice?.id || '')}
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
              {editingInvoice ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? 'تعديل بيانات الفاتورة المحددة' : 'إضافة فاتورة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
              <Input 
                id="invoiceNumber" 
                value={formData.invoiceNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ *</Label>
              <Input 
                id="date" 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
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
              <Label htmlFor="unitPrice">سعر الوحدة *</Label>
              <Input 
                id="unitPrice" 
                type="number"
                placeholder="أدخل سعر الوحدة"
                value={formData.unitPrice}
                onChange={(e) => setFormData(prev => ({...prev, unitPrice: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">المبلغ الإجمالي</Label>
              <Input 
                id="totalAmount" 
                value={formData.totalAmount}
                disabled
                className="bg-gray-50 font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">الحالة *</Label>
              <Select value={formData.status} onValueChange={(value: Invoice['status']) => setFormData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveInvoice}>
              {editingInvoice ? 'حفظ التعديل' : 'إضافة الفاتورة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}