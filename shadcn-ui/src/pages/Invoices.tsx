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
import { Plus, Search, Edit, Trash2, FileText, Calendar, X } from 'lucide-react';
import { Invoice, InvoiceItem, Supplier, Item, Currency } from '@/types';
import { generateInvoiceNumber } from '@/lib/autoNumber';
import { SupabaseInvoicesStorage, SupabaseSuppliersStorage, SupabaseItemsStorage, SupabaseCurrenciesStorage } from '@/lib/supabaseStorage';
import { toast } from 'sonner';

interface InvoicesProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Invoices({ quickActionTrigger }: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currencyId: '',
    status: 'pending' as Invoice['status'],
    notes: '',
    items: [] as InvoiceItem[]
  });

  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    quantity: '',
    unitPrice: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, suppliersData, itemsData, currenciesData] = await Promise.all([
        SupabaseInvoicesStorage.getAll(),
        SupabaseSuppliersStorage.getAll(),
        SupabaseItemsStorage.getAll(),
        SupabaseCurrenciesStorage.getAll()
      ]);
      setInvoices(invoicesData);
      setSuppliers(suppliersData);
      setItems(itemsData);
      setCurrencies(currenciesData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
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

    const unsubscribeCurrencies = SupabaseCurrenciesStorage.subscribe((newCurrencies) => {
      setCurrencies(newCurrencies);
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeSuppliers();
      unsubscribeItems();
      unsubscribeCurrencies();
    };
  }, []);

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

  const getCurrencySymbol = (currencyId?: string) => {
    if (!currencyId) {
      const baseCurrency = currencies.find(c => c.isBaseCurrency);
      return baseCurrency?.symbol || 'ر.س';
    }
    const currency = currencies.find(c => c?.id === currencyId);
    return currency?.symbol || 'ر.س';
  };

  const resetForm = () => {
    const baseCurrency = currencies.find(c => c.isBaseCurrency);
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      invoiceNumber: '',
      supplierId: '',
      issueDate: today,
      dueDate: '',
      currencyId: baseCurrency?.id || '',
      status: 'pending',
      notes: '',
      items: []
    });
    setCurrentItem({ itemId: '', quantity: '', unitPrice: '' });
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
      issueDate: invoice?.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate || '',
      currencyId: invoice?.currencyId || '',
      status: invoice?.status || 'pending',
      notes: invoice?.notes || '',
      items: invoice?.items || []
    });
    setIsDialogOpen(true);
  };

  const handleAddItemToInvoice = () => {
    if (!currentItem.itemId || !currentItem.quantity || !currentItem.unitPrice) {
      toast.error('يرجى ملء جميع حقول الصنف');
      return;
    }

    const quantity = parseInt(currentItem.quantity);
    const unitPrice = parseFloat(currentItem.unitPrice);
    const total = quantity * unitPrice;

    const newItem: InvoiceItem = {
      itemId: currentItem.itemId,
      quantity,
      unitPrice,
      total
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({ itemId: '', quantity: '', unitPrice: '' });
    toast.success('تم إضافة الصنف إلى الفاتورة');
  };

  const handleRemoveItemFromInvoice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    toast.success('تم حذف الصنف من الفاتورة');
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSaveInvoice = async () => {
    if (!formData.supplierId || !formData.issueDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة (المورد وتاريخ الإصدار)');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('يرجى إضافة صنف واحد على الأقل');
      return;
    }

    try {
      const totalAmount = calculateTotalAmount();

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        supplierId: formData.supplierId,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate || undefined,
        totalAmount,
        currencyId: formData.currencyId || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        items: formData.items
      };

      if (editingInvoice) {
        await SupabaseInvoicesStorage.update(editingInvoice.id, invoiceData);
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        await SupabaseInvoicesStorage.add(invoiceData);
        toast.success('تم إضافة الفاتورة بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ الفاتورة:', error);
      toast.error('حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        const result = await SupabaseInvoicesStorage.delete(invoiceId);
        if (result.success) {
          toast.success('تم حذف الفاتورة بنجاح');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('خطأ في حذف الفاتورة:', error);
        toast.error('حدث خطأ أثناء حذف الفاتورة');
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
                <TableHead>عدد الأصناف</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice?.id}>
                  <TableCell className="font-medium">{invoice?.invoiceNumber || 'غير محدد'}</TableCell>
                  <TableCell>{getSupplierName(invoice?.supplierId || '')}</TableCell>
                  <TableCell>{invoice?.items?.length || 0} صنف</TableCell>
                  <TableCell className="font-semibold">
                    {(invoice?.totalAmount || 0).toLocaleString('ar')} {getCurrencySymbol(invoice?.currencyId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 ml-1" />
                      {invoice?.issueDate || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 ml-1" />
                      {invoice?.dueDate || 'غير محدد'}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? 'تعديل بيانات الفاتورة المحددة' : 'إضافة فاتورة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* معلومات الفاتورة الأساسية */}
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
                <Label htmlFor="issueDate">تاريخ الإصدار *</Label>
                <Input 
                  id="issueDate" 
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({...prev, issueDate: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">تاريخ الاستحقاق (اختياري)</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">العملة *</Label>
                <Select value={formData.currencyId} onValueChange={(value) => setFormData(prev => ({...prev, currencyId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العملة" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency?.id} value={currency?.id || ''}>
                        {currency?.name} ({currency?.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-2">
              <Label htmlFor="notes">الملاحظات</Label>
              <Textarea 
                id="notes"
                placeholder="أدخل أي ملاحظات إضافية..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                rows={3}
              />
            </div>

            {/* إضافة الأصناف */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">الأصناف</h3>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">الصنف *</Label>
                  <Select value={currentItem.itemId} onValueChange={(value) => setCurrentItem(prev => ({...prev, itemId: value}))}>
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
                    placeholder="الكمية"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({...prev, quantity: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">سعر الوحدة *</Label>
                  <Input 
                    id="unitPrice" 
                    type="number"
                    placeholder="السعر"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem(prev => ({...prev, unitPrice: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={handleAddItemToInvoice} className="w-full">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة
                  </Button>
                </div>
              </div>

              {/* قائمة الأصناف المضافة */}
              {formData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
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
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{getItemName(item.itemId)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice.toLocaleString('ar')} {getCurrencySymbol(formData.currencyId)}</TableCell>
                          <TableCell className="font-semibold">{item.total.toLocaleString('ar')} {getCurrencySymbol(formData.currencyId)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItemFromInvoice(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell colSpan={3} className="text-left">المبلغ الإجمالي:</TableCell>
                        <TableCell colSpan={2}>{calculateTotalAmount().toLocaleString('ar')} {getCurrencySymbol(formData.currencyId)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse mt-6">
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