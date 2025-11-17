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
import { Plus, Search, Edit, Trash2, FileText, Calendar, X, RefreshCw } from 'lucide-react';
import { useGetAllInvoices, useAddInvoice, useUpdateInvoice, useDeleteInvoice, Invoice, InvoiceItem } from '@/pages/API/InvoicesAPI';
import { useGetAllSuppliers, Supplier } from '@/pages/API/SuppliersAPI';
import { useGetAllItems, Item } from '@/pages/API/ItemsAPI';
import { useGetAllCurrencies } from '@/pages/API/CurrenciesAPI';
import { toast } from 'sonner';

interface InvoicesProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Invoices({ quickActionTrigger }: InvoicesProps) {
  // APIs
  const { 
    data: invoicesData, 
    isLoading: invoicesLoading, 
    error: invoicesError, 
    refetch: refetchInvoices,
    isError: invoicesIsError 
  } = useGetAllInvoices();
  
  const { 
    data: suppliersData, 
    isLoading: suppliersLoading 
  } = useGetAllSuppliers();
  
  const { 
    data: itemsData, 
    isLoading: itemsLoading 
  } = useGetAllItems();
  
  const { 
    data: currenciesData 
  } = useGetAllCurrencies();

  const addInvoiceMutation = useAddInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    supplierId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'pending' as Invoice['status'],
    notes: '',
    currencyId: '',
    items: [] as InvoiceItem[]
  });

  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    quantity: '',
    unitPrice: ''
  });

  // Data
  const invoices: Invoice[] = Array.isArray(invoicesData) ? invoicesData : [];
  const suppliers: Supplier[] = Array.isArray(suppliersData) ? suppliersData : [];
  const items: Item[] = Array.isArray(itemsData) ? itemsData : [];
  const currencies = Array.isArray(currenciesData) ? currenciesData : [];
  const baseCurrency = currencies.find(c => c.isBase);

  const loading = invoicesLoading || suppliersLoading || itemsLoading;

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-invoice') {
      handleAddInvoice();
    }
  }, [quickActionTrigger]);

  const filteredInvoices = invoices.filter(invoice =>
    invoice?.number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    if (!supplierId) return 'غير محدد';
    const supplier = suppliers.find(s => s.id.toString() === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getItemName = (itemId: string) => {
    if (!itemId) return 'غير محدد';
    const item = items.find(i => i.id.toString() === itemId);
    return item?.name || 'غير محدد';
  };

  const formatPrice = (amount: number): string => {
    if (!baseCurrency) return amount.toString();
    return `${amount.toLocaleString('ar')} ${baseCurrency.symbol}`;
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      number: '',
      supplierId: '',
      issueDate: today,
      dueDate: '',
      status: 'pending',
      notes: '',
      currencyId: baseCurrency?.id.toString() || '',
      items: []
    });
    setCurrentItem({ itemId: '', quantity: '', unitPrice: '' });
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    resetForm();
    // توليد رقم فاتورة تلقائي (يمكن استبداله بدالة توليد أرقام)
    const invoiceNumber = `INV-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      number: invoiceNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      number: invoice.number,
      supplierId: invoice.supplierId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || '',
      status: invoice.status,
      notes: invoice.notes || '',
      currencyId: invoice.currencyId?.toString() || baseCurrency?.id.toString() || '',
      items: invoice.items
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

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('يرجى إدخال كمية صحيحة');
      return;
    }

    if (isNaN(unitPrice) || unitPrice < 0) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }

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

    const totalAmount = calculateTotalAmount();

    const invoiceData = {
      number: formData.number,
      supplierId: formData.supplierId,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate || undefined,
      totalAmount,
      status: formData.status,
      notes: formData.notes || undefined,
      currencyId: formData.currencyId ? parseInt(formData.currencyId) : undefined,
      items: formData.items
    };

    try {
      if (editingInvoice) {
        await updateInvoiceMutation.mutateAsync({ 
          id: editingInvoice.id, 
          data: invoiceData 
        });
      } else {
        await addInvoiceMutation.mutateAsync(invoiceData);
      }

      setIsDialogOpen(false);
      resetForm();
      setEditingInvoice(null);
    } catch (error) {
      console.error('خطأ في حفظ الفاتورة:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await deleteInvoiceMutation.mutateAsync(invoiceId);
      } catch (error) {
        console.error('خطأ في حذف الفاتورة:', error);
      }
    }
  };

  const handleRetry = () => {
    refetchInvoices();
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

  if (invoicesIsError) {
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
              {invoicesError instanceof Error ? invoicesError.message : 'تعذر تحميل بيانات الفواتير'}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة الفواتير</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة جميع فواتير الشراء والمدفوعات</p>
          {baseCurrency && (
            <p className="text-xs text-gray-500 mt-1">جميع المبالغ بـ {baseCurrency.name} ({baseCurrency.symbol})</p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRetry}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button 
            onClick={handleAddInvoice} 
            className="flex items-center justify-center flex-1 sm:flex-none"
            disabled={addInvoiceMutation.isLoading}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة فاتورة جديدة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث برقم الفاتورة..."
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
            <FileText className="h-5 w-5 ml-2" />
            قائمة الفواتير ({filteredInvoices.length})
          </CardTitle>
          <CardDescription className="text-sm">جميع الفواتير المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="overflow-x-auto">
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
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{getSupplierName(invoice.supplierId)}</TableCell>
                    <TableCell>{invoice.items.length} صنف</TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                        {invoice.issueDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                        {invoice.dueDate || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditInvoice(invoice)}
                          disabled={updateInvoiceMutation.isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteInvoiceMutation.isLoading}
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

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد فواتير تطابق البحث' : 'لا توجد فواتير مسجلة'}
              </p>
            </div>
          )}
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
              {baseCurrency && (
                <span className="block mt-1 text-xs">جميع المبالغ بـ {baseCurrency.name} ({baseCurrency.symbol})</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* معلومات الفاتورة الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">رقم الفاتورة</Label>
                <Input 
                  id="number" 
                  value={formData.number}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد <span className="text-red-600">*</span></Label>
                <Select 
                  value={formData.supplierId} 
                  onValueChange={(value) => setFormData(prev => ({...prev, supplierId: value}))}
                  disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">تاريخ الإصدار <span className="text-red-600">*</span></Label>
                <Input 
                  id="issueDate" 
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({...prev, issueDate: e.target.value}))}
                  disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">تاريخ الاستحقاق (اختياري)</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
                  disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة <span className="text-red-600">*</span></Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: Invoice['status']) => setFormData(prev => ({...prev, status: value}))}
                  disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                >
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
                disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
              />
            </div>

            {/* إضافة الأصناف */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">الأصناف</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">الصنف <span className="text-red-600">*</span></Label>
                  <Select 
                    value={currentItem.itemId} 
                    onValueChange={(value) => setCurrentItem(prev => ({...prev, itemId: value}))}
                    disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصنف" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية <span className="text-red-600">*</span></Label>
                  <Input 
                    id="quantity" 
                    type="number"
                    placeholder="الكمية"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({...prev, quantity: e.target.value}))}
                    disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">
                    سعر الوحدة <span className="text-red-600">*</span> {baseCurrency && `(${baseCurrency.symbol})`}
                  </Label>
                  <Input 
                    id="unitPrice" 
                    type="number"
                    step="0.01"
                    placeholder="السعر"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem(prev => ({...prev, unitPrice: e.target.value}))}
                    disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={handleAddItemToInvoice} 
                    className="w-full"
                    disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                  >
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
                          <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(item.total)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItemFromInvoice(index)}
                              className="text-red-600 hover:text-red-700"
                              disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell colSpan={3} className="text-left">المبلغ الإجمالي:</TableCell>
                        <TableCell colSpan={2}>{formatPrice(calculateTotalAmount())}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveInvoice}
              className="w-full sm:w-auto"
              disabled={addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading}
            >
              {addInvoiceMutation.isLoading || updateInvoiceMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingInvoice ? 'جاري التحديث...' : 'جاري الإضافة...'}
                </>
              ) : (
                editingInvoice ? 'حفظ التعديل' : 'إضافة الفاتورة'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}