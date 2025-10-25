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
import { mockInvoices, mockSuppliers, mockItems } from '@/data/mockData';
import { Invoice, InvoiceItem } from '@/types';
import { AutoNumberGenerator } from '@/lib/autoNumber';
import { InvoicesStorage, SuppliersStorage, ItemsStorage } from '@/lib/localStorage';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // حالات النموذج
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
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

  // دالة مساعدة لتنسيق الأرقام بأمان
  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString('ar');
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    const storedInvoices = InvoicesStorage.getAll();
    if (storedInvoices.length > 0) {
      setInvoices(storedInvoices);
    } else {
      // إذا لم توجد بيانات محفوظة، استخدم البيانات الوهمية وحفظها
      setInvoices(mockInvoices);
      InvoicesStorage.save(mockInvoices);
    }
  }, []);

  // حفظ تلقائي عند تغيير الفواتير
  useEffect(() => {
    if (invoices.length > 0) {
      InvoicesStorage.save(invoices);
    }
  }, [invoices]);

  const filteredInvoices = invoices.filter(invoice =>
    invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSupplierName(invoice?.supplierId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    if (!supplierId) return 'غير محدد';
    const storedSuppliers = SuppliersStorage.getAll();
    const allSuppliers = storedSuppliers.length > 0 ? storedSuppliers : mockSuppliers;
    const supplier = allSuppliers.find(s => s?.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getItemName = (itemId: string) => {
    if (!itemId) return 'غير محدد';
    const storedItems = ItemsStorage.getAll();
    const allItems = storedItems.length > 0 ? storedItems : mockItems;
    const item = allItems.find(i => i?.id === itemId);
    return item?.name || 'غير محدد';
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
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

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    resetForm();
    setFormData(prev => ({
      ...prev,
      invoiceNumber: AutoNumberGenerator.generateInvoiceNumber()
    }));
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice?.invoiceNumber || '',
      supplierId: invoice?.supplierId || '',
      dueDate: invoice?.dueDate ? invoice.dueDate.toISOString().split('T')[0] : '',
      status: invoice?.status || 'pending',
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

  const handleSaveInvoice = () => {
    if (!formData.supplierId || !formData.dueDate || !formData.status || invoiceItems.length === 0) {
      alert('يرجى ملء جميع الحقول المطلوبة وإضافة صنف واحد على الأقل');
      return;
    }

    const newInvoice: Invoice = {
      id: editingInvoice?.id || Date.now().toString(),
      invoiceNumber: formData.invoiceNumber,
      supplierId: formData.supplierId,
      items: invoiceItems,
      totalAmount: calculateTotal(invoiceItems),
      dueDate: new Date(formData.dueDate),
      status: formData.status as Invoice['status'],
      notes: formData.notes,
      createdAt: editingInvoice?.createdAt || new Date()
    };

    if (editingInvoice) {
      // تحديث الفاتورة الموجودة
      const updatedInvoices = invoices.map(invoice => 
        invoice?.id === editingInvoice.id ? newInvoice : invoice
      );
      setInvoices(updatedInvoices);
    } else {
      // إضافة فاتورة جديدة
      setInvoices([...invoices, newInvoice]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      const updatedInvoices = invoices.filter(invoice => invoice?.id !== invoiceId);
      setInvoices(updatedInvoices);
    }
  };

  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter(i => i?.status === 'pending').length;
  const paidInvoices = invoices.filter(i => i?.status === 'paid').length;
  const overdueInvoices = invoices.filter(i => i?.status === 'overdue').length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice?.totalAmount || 0), 0);

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

      {/* إحصائيات سريعة */}
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
                placeholder="البحث برقم الفاتورة أو المورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلتر حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الفواتير */}
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
                      {invoice?.dueDate ? invoice.dueDate.toLocaleDateString('ar-SA') : 'غير محدد'}
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

      {/* نافذة إضافة/تعديل الفاتورة */}
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
          
          {/* بيانات الفاتورة الأساسية */}
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
                  {(SuppliersStorage.getAll().length > 0 ? SuppliersStorage.getAll() : mockSuppliers).map((supplier) => (
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
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* إضافة الأصناف */}
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">أصناف الفاتورة</h3>
            
            {/* نموذج إضافة صنف جديد */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label>الصنف</Label>
                <Select value={newItem.itemId} onValueChange={(value) => setNewItem(prev => ({...prev, itemId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصنف" />
                  </SelectTrigger>
                  <SelectContent>
                    {(ItemsStorage.getAll().length > 0 ? ItemsStorage.getAll() : mockItems).map((item) => (
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

            {/* قائمة الأصناف المضافة */}
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

          {/* ملاحظات */}
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