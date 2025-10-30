import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { Currency } from '@/types';
import { SupabaseCurrenciesStorage } from '@/lib/supabaseStorage';
import { toast } from 'sonner';

interface CurrenciesProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Currencies({ quickActionTrigger }: CurrenciesProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    symbol: '',
    exchangeRate: '',
    isBaseCurrency: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const currenciesData = await SupabaseCurrenciesStorage.getAll();
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

    const unsubscribe = SupabaseCurrenciesStorage.subscribe((newCurrencies) => {
      setCurrencies(newCurrencies);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-currency') {
      handleAddCurrency();
    }
  }, [quickActionTrigger]);

  const filteredCurrencies = currencies.filter(currency =>
    currency?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      symbol: '',
      exchangeRate: '',
      isBaseCurrency: false
    });
  };

  const handleAddCurrency = () => {
    setEditingCurrency(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      name: currency?.name || '',
      code: currency?.code || '',
      symbol: currency?.symbol || '',
      exchangeRate: (currency?.exchangeRate || 0).toString(),
      isBaseCurrency: currency?.isBaseCurrency || false
    });
    setIsDialogOpen(true);
  };

  const handleSaveCurrency = async () => {
    if (!formData.name || !formData.code || !formData.symbol || !formData.exchangeRate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const exchangeRate = parseFloat(formData.exchangeRate);
    if (isNaN(exchangeRate) || exchangeRate <= 0) {
      toast.error('يرجى إدخال سعر صرف صحيح');
      return;
    }

    try {
      const currencyData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        symbol: formData.symbol,
        exchangeRate,
        isBaseCurrency: formData.isBaseCurrency
      };

      if (editingCurrency) {
        await SupabaseCurrenciesStorage.update(editingCurrency.id, currencyData);
        toast.success('تم تحديث العملة بنجاح');
      } else {
        await SupabaseCurrenciesStorage.add(currencyData);
        toast.success('تم إضافة العملة بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ العملة:', error);
      toast.error('حدث خطأ أثناء حفظ العملة');
    }
  };

  const handleDeleteCurrency = async (currencyId: string) => {
    try {
      const result = await SupabaseCurrenciesStorage.delete(currencyId);
      
      if (result.success) {
        toast.success('تم حذف العملة بنجاح');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('خطأ في حذف العملة:', error);
      toast.error('حدث خطأ أثناء حذف العملة');
    }
  };

  const baseCurrency = currencies.find(c => c.isBaseCurrency);

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
          <h1 className="text-3xl font-bold text-gray-900">إدارة العملات</h1>
          <p className="text-gray-600 mt-2">إدارة العملات وأسعار الصرف</p>
        </div>
        <Button onClick={handleAddCurrency} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة عملة جديدة
        </Button>
      </div>

      {baseCurrency && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <DollarSign className="h-5 w-5 ml-2" />
              العملة الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">{baseCurrency.name}</p>
                <p className="text-blue-700">الرمز: {baseCurrency.code} | الرمز المعروض: {baseCurrency.symbol}</p>
              </div>
              <Badge className="bg-blue-600 text-white">العملة الافتراضية</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث بالاسم أو الرمز..."
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
            <TrendingUp className="h-5 w-5 ml-2" />
            قائمة العملات ({filteredCurrencies.length})
          </CardTitle>
          <CardDescription>جميع العملات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم العملة</TableHead>
                <TableHead>الرمز</TableHead>
                <TableHead>الرمز المعروض</TableHead>
                <TableHead>سعر الصرف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurrencies.map((currency) => (
                <TableRow key={currency?.id}>
                  <TableCell className="font-medium">{currency?.name || 'غير محدد'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {currency?.code || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xl">{currency?.symbol || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-semibold">{(currency?.exchangeRate || 0).toFixed(4)}</span>
                      {baseCurrency && (
                        <span className="text-sm text-gray-500 mr-2">
                          {baseCurrency.symbol}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {currency?.isBaseCurrency ? (
                      <Badge className="bg-blue-100 text-blue-800">عملة أساسية</Badge>
                    ) : (
                      <Badge variant="outline">عملة ثانوية</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCurrency(currency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (currency.isBaseCurrency) {
                            toast.error('لا يمكن حذف العملة الأساسية');
                            return;
                          }
                          if (confirm('هل أنت متأكد من حذف هذه العملة؟')) {
                            handleDeleteCurrency(currency?.id || '');
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                        disabled={currency?.isBaseCurrency}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCurrency ? 'تعديل العملة' : 'إضافة عملة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingCurrency ? 'تعديل بيانات العملة المحددة' : 'إضافة عملة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العملة *</Label>
              <Input 
                id="name" 
                placeholder="مثال: الريال السعودي"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">رمز العملة *</Label>
                <Input 
                  id="code" 
                  placeholder="مثال: SAR"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({...prev, code: e.target.value.toUpperCase()}))}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">الرمز المعروض *</Label>
                <Input 
                  id="symbol" 
                  placeholder="مثال: ر.س"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({...prev, symbol: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">سعر الصرف *</Label>
              <Input 
                id="exchangeRate" 
                type="number"
                step="0.0001"
                placeholder="مثال: 3.75"
                value={formData.exchangeRate}
                onChange={(e) => setFormData(prev => ({...prev, exchangeRate: e.target.value}))}
              />
              <p className="text-xs text-gray-500">
                سعر الصرف مقابل العملة الأساسية
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isBaseCurrency">عملة أساسية</Label>
                <p className="text-xs text-gray-500">
                  تعيين كعملة افتراضية للنظام
                </p>
              </div>
              <Switch
                id="isBaseCurrency"
                checked={formData.isBaseCurrency}
                onCheckedChange={(checked) => setFormData(prev => ({...prev, isBaseCurrency: checked}))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveCurrency}>
              {editingCurrency ? 'حفظ التعديل' : 'إضافة العملة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}