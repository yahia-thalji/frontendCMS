import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, Edit, Trash2, FileText, Eye, Download, Check, ChevronsUpDown, X } from 'lucide-react';
import { mockInvoices, mockSuppliers, mockItems } from '@/data/mockData';
import { Invoice, InvoiceItem, Supplier, Item } from '@/types';

interface InvoiceFormItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // حالات نموذج الفاتورة
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceFormItem[]>([]);
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [customsFees, setCustomsFees] = useState(0);
  const [insurance, setInsurance] = useState(0);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = mockSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );

  const filteredItems = mockItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.referenceNumber.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  // توليد رقم فاتورة تلقائي
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const lastInvoiceNumber = invoices.length > 0 ? 
      Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber.split('-')[2]) || 0)) : 0;
    const nextNumber = String(lastInvoiceNumber + 1).padStart(3, '0');
    return `INV-${year}${month}-${nextNumber}`;
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    return supplier?.name || 'غير محدد';
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'outline' as const, color: 'text-gray-600' },
      pending: { label: 'معلقة', variant: 'outline' as const, color: 'text-yellow-600' },
      paid: { label: 'مدفوعة', variant: 'outline' as const, color: 'text-green-600' },
      overdue: { label: 'متأخرة', variant: 'destructive' as const, color: 'text-red-600' },
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setSelectedSupplier(null);
    setInvoiceItems([]);
    setShippingCost(0);
    setCustomsFees(0);
    setInsurance(0);
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const supplier = mockSuppliers.find(s => s.id === invoice.supplierId);
    setSelectedSupplier(supplier || null);
    
    // تحويل عناصر الفاتورة إلى تنسيق النموذج
    const formItems = invoice.items.map(item => {
      const itemData = mockItems.find(i => i.id === item.itemId);
      return {
        itemId: item.itemId,
        itemName: itemData?.name || 'صنف غير محدد',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      };
    });
    setInvoiceItems(formItems);
    setShippingCost(invoice.shippingCost);
    setCustomsFees(invoice.customsFees);
    setInsurance(invoice.insurance);
    setIsDialogOpen(true);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
  };

  const handleAddItemToInvoice = (item: Item) => {
    const existingItemIndex = invoiceItems.findIndex(invItem => invItem.itemId === item.id);
    
    if (existingItemIndex >= 0) {
      // إذا كان الصنف موجود، زيادة الكمية
      const updatedItems = [...invoiceItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setInvoiceItems(updatedItems);
    } else {
      // إضافة صنف جديد
      const newItem: InvoiceFormItem = {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: item.price,
        total: item.price
      };
      setInvoiceItems([...invoiceItems, newItem]);
    }
    setItemSearchOpen(false);
    setItemSearchTerm('');
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].unitPrice;
    setInvoiceItems(updatedItems);
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index].unitPrice = price;
    updatedItems[index].total = updatedItems[index].quantity * price;
    setInvoiceItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost + customsFees + insurance;
  };

  const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الفواتير</h1>
          <p className="text-gray-600 mt-2">إدارة جميع فواتير المشتريات والمدفوعات</p>
        </div>
        <Button onClick={handleAddInvoice} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إنشاء فاتورة جديدة
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
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-gray-600">فاتورة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoiceValue.toLocaleString('ar')}</div>
            <p className="text-xs text-gray-600">ريال سعودي</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المدفوعة</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
            <p className="text-xs text-gray-600">فاتورة مدفوعة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المتأخرة</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices}</div>
            <p className="text-xs text-gray-600">فاتورة متأخرة</p>
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
                placeholder="البحث برقم الفاتورة..."
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
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="pending">معلقة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
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
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>المبلغ الفرعي</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{getSupplierName(invoice.supplierId)}</TableCell>
                  <TableCell>{invoice.issueDate.toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>{invoice.dueDate.toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>{invoice.subtotal.toLocaleString('ar')} ريال</TableCell>
                  <TableCell className="font-semibold">
                    {invoice.total.toLocaleString('ar')} ريال
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
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
                        onClick={() => handleDeleteInvoice(invoice.id)}
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? 'تعديل بيانات الفاتورة المحددة' : 'إنشاء فاتورة جديدة في النظام'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* معلومات الفاتورة الأساسية */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
                <Input 
                  id="invoiceNumber" 
                  value={editingInvoice?.invoiceNumber || generateInvoiceNumber()}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label>المورد</Label>
                <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supplierSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedSupplier ? selectedSupplier.name : "اختر المورد..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="البحث عن مورد..." 
                        value={supplierSearchTerm}
                        onValueChange={setSupplierSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>لم يتم العثور على موردين.</CommandEmpty>
                        <CommandGroup>
                          {filteredSuppliers.map((supplier) => (
                            <CommandItem
                              key={supplier.id}
                              value={supplier.name}
                              onSelect={() => {
                                setSelectedSupplier(supplier);
                                setSupplierSearchOpen(false);
                                setSupplierSearchTerm('');
                              }}
                            >
                              <Check
                                className={`ml-2 h-4 w-4 ${
                                  selectedSupplier?.id === supplier.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div>
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-sm text-gray-500">{supplier.email}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issueDate">تاريخ الإصدار</Label>
                <Input id="issueDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                <Input id="dueDate" type="date" />
              </div>
            </div>

            {/* قسم إضافة الأصناف */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  أصناف الفاتورة
                  <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة صنف
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput 
                          placeholder="البحث عن صنف..." 
                          value={itemSearchTerm}
                          onValueChange={setItemSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>لم يتم العثور على أصناف.</CommandEmpty>
                          <CommandGroup>
                            {filteredItems.map((item) => (
                              <CommandItem
                                key={item.id}
                                onSelect={() => handleAddItemToInvoice(item)}
                              >
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {item.referenceNumber} - {item.price.toLocaleString('ar')} ريال
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الصنف</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>سعر الوحدة</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-20"
                              min="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            {item.total.toLocaleString('ar')} ريال
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لم يتم إضافة أي أصناف بعد. اضغط على "إضافة صنف" لبدء إضافة الأصناف.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* التكاليف الإضافية والإجمالي */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">تكلفة الشحن</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    placeholder="أدخل تكلفة الشحن"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customsFees">الرسوم الجمركية</Label>
                  <Input
                    id="customsFees"
                    type="number"
                    value={customsFees}
                    onChange={(e) => setCustomsFees(parseFloat(e.target.value) || 0)}
                    placeholder="أدخل الرسوم الجمركية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance">التأمين</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(parseFloat(e.target.value) || 0)}
                    placeholder="أدخل قيمة التأمين"
                  />
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الفاتورة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>المبلغ الفرعي:</span>
                    <span className="font-semibold">{calculateSubtotal().toLocaleString('ar')} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تكلفة الشحن:</span>
                    <span>{shippingCost.toLocaleString('ar')} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الرسوم الجمركية:</span>
                    <span>{customsFees.toLocaleString('ar')} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التأمين:</span>
                    <span>{insurance.toLocaleString('ar')} ريال</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>المبلغ الإجمالي:</span>
                    <span>{calculateTotal().toLocaleString('ar')} ريال</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {editingInvoice ? 'حفظ التعديل' : 'إنشاء الفاتورة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}