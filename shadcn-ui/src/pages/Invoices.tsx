import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, FileText, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Invoice, InvoiceItem, Supplier, Item } from '@/types';
import { generateInvoiceNumber } from '@/lib/autoNumber';
import { SupabaseInvoicesStorage, SupabaseSuppliersStorage, SupabaseItemsStorage } from '@/lib/supabaseStorage';

export default function Invoices() {
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
    issueDate: '',
    dueDate: '',
    status: '' as Invoice['status'] | '',
    notes: ''
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    itemId: '',
    quantity: '',
    unitPrice: ''
  });

  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

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

  const filteredInvoices = invoices.filter(invoice =>
    invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSupplierName(invoice?.supplierId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const, color: 'text-gray-600' },
      pending: { label: 'معلق', variant: 'outline' as const, color: 'text-yellow-600' },
      paid: { label: 'مدفوع', variant: 'outline' as const, color: 'text-green-600' },
      overdue: { label: 'متأخر', variant: 'outline' as const, color: 'text-red-600' },
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0);
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      supplierId: '',
      issueDate: '',
      dueDate: '',
      status: '',
      notes: ''
    });
    setInvoiceItems([]);
    setNewItem({
      itemId: '',
      quantity: '',
      unitPrice: ''
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
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      status: invoice?.status || 'draft',
      notes: invoice?.notes || ''
    });
    setInvoiceItems(invoice?.items || []);
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.itemId || !newItem.quantity || !newItem.unitPrice) {
      alert('يرجى ملء جميع بيانات الصنف');
      return;
    }

    const item: InvoiceItem = {
      itemId: newItem.itemId,
      quantity: parseInt(newItem.quantity) || 0,
      unitPrice: parseFloat(newItem.unitPrice) || 0
    };

    setInvoiceItems([...invoiceItems, item]);
    setNewItem({
      itemId: '',
      quantity: '',
      unitPrice: ''
    });
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async () => {
    if (!formData.supplierId || !formData.dueDate || !formData.status || invoiceItems.length === 0) {
      alert('يرجى ملء جميع الحقول المطلوبة وإضافة صنف واحد على الأقل');
      return;
    }

    try {
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        supplierId: formData.supplierId,
        items: invoiceItems,
        totalAmount: calculateTotal(invoiceItems),
        issueDate: formData.issueDate || new Date().toISOString(),
        dueDate: formData.dueDate,
        status: formData.status as Invoice['status'],
        notes: formData.notes
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

  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter(i => i?.status === 'pending').length;
  const overdueInvoices = invoices.filter(i => i?.status === 'overdue').length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice?.totalAmount || 0), 0);

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
          <p className="text-gray-600 mt-2">إدارة جميع فواتير الموردين والمشتريات</p>
        </div>
        <Button onClick={handleAddInvoice} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة فاتورة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-gray-600">فاتورة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فواتير معلقة</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-gray-600">في الانتظار</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فواتير متأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices}</div>
            <p className="text-xs text-gray-600">متأخرة الدفع</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبلغ</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToLocaleString(totalAmount)}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
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
                placeholder="البحث برقم الفاتورة أو المورد..."
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
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>عدد الأصناف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice?.id || Math.random()}>
                  <TableCell className="font-medium">{invoice?.invoiceNumber || 'غير محدد'}</TableCell>
                  <TableCell>{getSupplierName(invoice?.supplierId || '')}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 ml-1" />
                      {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>{safeToLocaleString(invoice?.totalAmount)} ريال</TableCell>
                  <TableCell>{invoice?.items?.length || 0} صنف</TableCell>
                  <TableCell>{invoice?.status ? getStatusBadge(invoice.status) : 'غير محدد'}</TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? 'تعديل بيانات الفاتورة المحددة' : 'إضافة فاتورة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
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
              <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">حالة الفاتورة *</Label>
              <Select value={formData.status} onValueChange={(value: Invoice['status']) => setFormData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">أصناف الفاتورة</h3>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label>الصنف</Label>
                <Select value={newItem.itemId} onValueChange={(value) => setNewItem(prev => ({...prev, itemId: value}))}>
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
                <Label>الكمية</Label>
                <Input 
                  type="number" 
                  placeholder="الكمية"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({...prev, quantity: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>سعر الوحدة</Label>
                <Input 
                  type="number" 
                  placeholder="السعر"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem(prev => ({...prev, unitPrice: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={handleAddItem} className="w-full">
                  إضافة الصنف
                </Button>
              </div>
            </div>

            {invoiceItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصنف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>سعر الوحدة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{getItemName(item?.itemId || '')}</TableCell>
                      <TableCell>{item?.quantity || 0}</TableCell>
                      <TableCell>{safeToLocaleString(item?.unitPrice)} ريال</TableCell>
                      <TableCell>{safeToLocaleString((item?.quantity || 0) * (item?.unitPrice || 0))} ريال</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={3}>الإجمالي الكلي:</TableCell>
                    <TableCell>{safeToLocaleString(calculateTotal(invoiceItems))} ريال</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input 
              id="notes" 
              placeholder="أدخل أي ملاحظات إضافية"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
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