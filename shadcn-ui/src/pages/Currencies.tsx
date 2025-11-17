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
import { useGetAllCurrencies, useAddCurrency, useUpdateCurrency, useDeleteCurrency } from '@/pages/API/CurrenciesAPI';
import { toast } from 'sonner';

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CurrenciesProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Currencies({ quickActionTrigger }: CurrenciesProps) {
  const { data: currenciesData, isLoading, error, refetch } = useGetAllCurrencies();
  const addCurrencyMutation = useAddCurrency();
  const updateCurrencyMutation = useUpdateCurrency();
  const deleteCurrencyMutation = useDeleteCurrency();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    symbol: '',
    exchangeRate: '',
    isBase: false
  });

  const currencies: Currency[] = (currenciesData as Currency[]) || [];

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
      isBase: false
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
      isBase: currency?.isBase || false
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

    const currencyData = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      symbol: formData.symbol,
      exchangeRate,
      isBase: formData.isBase
    };

    try {
      if (editingCurrency) {
        await updateCurrencyMutation.mutateAsync({ 
          id: editingCurrency.id, 
          data: currencyData 
        });
      } else {
        await addCurrencyMutation.mutateAsync(currencyData);
      }

      setIsDialogOpen(false);
      resetForm();
      setEditingCurrency(null);
    } catch (error) {
      console.error('خطأ في حفظ العملة:', error);
      // يتم التعامل مع الخطأ في الـ mutation
    }
  };

  const handleDeleteCurrency = async (currencyId: number) => {
    if (confirm('هل أنت متأكد من حذف هذه العملة؟')) {
      try {
        await deleteCurrencyMutation.mutateAsync(currencyId);
      } catch (error) {
        console.error('خطأ في حذف العملة:', error);
        // يتم التعامل مع الخطأ في الـ mutation
      }
    }
  };

  const baseCurrency = currencies.find(c => c.isBase);

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">حدث خطأ في تحميل البيانات</p>
          <Button onClick={() => refetch()} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة العملات</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة العملات وأسعار الصرف</p>
        </div>
        <Button 
          onClick={handleAddCurrency} 
          className="w-full sm:w-auto flex items-center justify-center"
          disabled={addCurrencyMutation.isLoading}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة عملة جديدة
        </Button>
      </div>

      {baseCurrency && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center text-blue-900 text-lg md:text-xl">
              <DollarSign className="h-5 w-5 ml-2" />
              العملة الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xl md:text-2xl font-bold text-blue-900">{baseCurrency.name}</p>
                <p className="text-sm md:text-base text-blue-700">الرمز: {baseCurrency.code} | الرمز المعروض: {baseCurrency.symbol}</p>
              </div>
              <Badge className="bg-blue-600 text-white w-fit">العملة الافتراضية</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث بالاسم أو الرمز..."
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
            <TrendingUp className="h-5 w-5 ml-2" />
            قائمة العملات ({filteredCurrencies.length})
          </CardTitle>
          <CardDescription className="text-sm">جميع العملات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                  <TableRow key={currency.id}>
                    <TableCell className="font-medium">{currency.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {currency.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xl">{currency.symbol}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-semibold">{currency.exchangeRate.toFixed(4)}</span>
                        {baseCurrency && (
                          <span className="text-sm text-gray-500 mr-2">
                            {baseCurrency.symbol}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currency.isBase ? (
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
                          disabled={updateCurrencyMutation.isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCurrency(currency.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={currency.isBase || deleteCurrencyMutation.isLoading}
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
            {filteredCurrencies.map((currency) => (
              <Card key={currency.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{currency.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {currency.code}
                        </Badge>
                        <span className="text-xl">{currency.symbol}</span>
                      </div>
                    </div>
                    {currency.isBase ? (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">أساسية</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">ثانوية</Badge>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">سعر الصرف:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold">{currency.exchangeRate.toFixed(4)}</span>
                      {baseCurrency && (
                        <span className="text-sm text-gray-500">{baseCurrency.symbol}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCurrency(currency)}
                      className="flex-1"
                      disabled={updateCurrencyMutation.isLoading}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCurrency(currency.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                      disabled={currency.isBase || deleteCurrencyMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCurrencies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد عملات</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
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
                  disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">الرمز المعروض *</Label>
                <Input 
                  id="symbol" 
                  placeholder="مثال: ر.س"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({...prev, symbol: e.target.value}))}
                  disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
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
                disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
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
                checked={formData.isBase}
                onCheckedChange={(checked) => setFormData(prev => ({...prev, isBase: checked}))}
                disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveCurrency}
              className="w-full sm:w-auto"
              disabled={addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading}
            >
              {addCurrencyMutation.isLoading || updateCurrencyMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingCurrency ? 'جاري التحديث...' : 'جاري الإضافة...'}
                </>
              ) : (
                editingCurrency ? 'حفظ التعديل' : 'إضافة العملة'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}