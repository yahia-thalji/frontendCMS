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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Search, Edit, Trash2, MapPin, Warehouse, Archive, AlertTriangle, RefreshCw } from 'lucide-react';
import { useGetAllLocations, useAddLocation, useUpdateLocation, useDeleteLocation, Location } from '@/pages/API/LocationsAPI';
import { toast } from 'sonner';

interface LocationsProps {
  quickActionTrigger?: { action: string; timestamp: number } | null;
}

export default function Locations({ quickActionTrigger }: LocationsProps) {
  const { 
    data: locationsData, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useGetAllLocations();
  
  const addLocationMutation = useAddLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    name: '',
    type: '',
    capacity: '',
    currentUsage: '',
    address: ''
  });

  const locations: Location[] = Array.isArray(locationsData) ? locationsData : [];

  useEffect(() => {
    if (quickActionTrigger?.action === 'add-location') {
      handleAddLocation();
    }
  }, [quickActionTrigger]);

  const filteredLocations = locations.filter(location =>
    location?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location?.number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
        return Warehouse;
      case 'shelf':
        return Archive;
      case 'section':
        return MapPin;
      default:
        return MapPin;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      warehouse: 'مخزن',
      shelf: 'رف',
      section: 'قسم',
    };
    return labels[type] || type;
  };

  const getCapacityPercentage = (current: number, capacity: number) => {
    if (capacity === 0) return 0;
    return Math.round((current / capacity) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const resetForm = () => {
    setFormData({
      number: '',
      name: '',
      type: '',
      capacity: '',
      currentUsage: '',
      address: ''
    });
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    resetForm();
    // توليد رقم موقع تلقائي (يمكن استبداله بدالة توليد أرقام)
    const locationNumber = `LOC-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      number: locationNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      number: location.number,
      name: location.name,
      type: location.type,
      capacity: location.capacity.toString(),
      currentUsage: location.currentUsage.toString(),
      address: location.address || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!formData.name || !formData.type || !formData.capacity) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const capacity = parseInt(formData.capacity);
    const currentUsage = parseInt(formData.currentUsage) || 0;

    if (isNaN(capacity) || capacity < 0) {
      toast.error('يرجى إدخال سعة صحيحة');
      return;
    }

    if (currentUsage > capacity) {
      toast.error('لا يمكن أن يكون المخزون الحالي أكبر من السعة القصوى');
      return;
    }

    const locationData = {
      number: formData.number,
      name: formData.name,
      type: formData.type,
      capacity,
      currentUsage,
      address: formData.address
    };

    try {
      if (editingLocation) {
        await updateLocationMutation.mutateAsync({ 
          id: editingLocation.id, 
          data: locationData 
        });
      } else {
        await addLocationMutation.mutateAsync(locationData);
      }

      setIsDialogOpen(false);
      resetForm();
      setEditingLocation(null);
    } catch (error) {
      console.error('خطأ في حفظ الموقع:', error);
    }
  };

  const handleDeleteLocation = (locationId: number) => {
    setLocationToDelete(locationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocationMutation.mutateAsync(locationToDelete);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error('خطأ في حذف الموقع:', error);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  const totalCapacity = locations.reduce((sum, location) => sum + location.capacity, 0);
  const totalUsed = locations.reduce((sum, location) => sum + location.currentUsage, 0);
  const utilizationRate = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

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
              {error instanceof Error ? error.message : 'تعذر تحميل بيانات المواقع'}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة مواقع التخزين</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">إدارة جميع مواقع التخزين والمخازن</p>
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
            onClick={handleAddLocation} 
            className="flex items-center justify-center flex-1 sm:flex-none"
            disabled={addLocationMutation.isLoading}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة موقع جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المواقع</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-gray-600">موقع تخزين</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">السعة الإجمالية</CardTitle>
            <Warehouse className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity.toLocaleString('ar')}</div>
            <p className="text-xs text-gray-600">وحدة تخزين</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المساحة المستخدمة</CardTitle>
            <Archive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed.toLocaleString('ar')}</div>
            <p className="text-xs text-gray-600">وحدة مستخدمة</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الاستخدام</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate}%</div>
            <Progress value={utilizationRate} className="mt-2" />
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
              placeholder="البحث باسم الموقع أو الرقم..."
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
            <MapPin className="h-5 w-5 ml-2" />
            قائمة المواقع ({filteredLocations.length})
          </CardTitle>
          <CardDescription className="text-sm">جميع مواقع التخزين المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الموقع</TableHead>
                  <TableHead>اسم الموقع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>السعة</TableHead>
                  <TableHead>المخزون الحالي</TableHead>
                  <TableHead>معدل الاستخدام</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => {
                  const Icon = getLocationIcon(location.type);
                  const percentage = getCapacityPercentage(location.currentUsage, location.capacity);
                  const colorClass = getCapacityColor(percentage);
                  
                  return (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.number}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 ml-2 text-gray-500" />
                          {location.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(location.type)}</Badge>
                      </TableCell>
                      <TableCell>{location.capacity.toLocaleString('ar')}</TableCell>
                      <TableCell className={colorClass}>
                        {location.currentUsage.toLocaleString('ar')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Progress value={percentage} className="w-16" />
                          <span className={`text-sm font-medium ${colorClass}`}>
                            {percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLocation(location)}
                            disabled={updateLocationMutation.isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleteLocationMutation.isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredLocations.map((location) => {
              const Icon = getLocationIcon(location.type);
              const percentage = getCapacityPercentage(location.currentUsage, location.capacity);
              const colorClass = getCapacityColor(percentage);
              
              return (
                <Card key={location.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{location.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {location.number}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(location.type)}
                          </Badge>
                        </div>
                      </div>
                      <Icon className="h-5 w-5 text-gray-500" />
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">السعة:</span>
                          <p className="font-medium">{location.capacity.toLocaleString('ar')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">المستخدم:</span>
                          <p className={`font-medium ${colorClass}`}>
                            {location.currentUsage.toLocaleString('ar')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-500">معدل الاستخدام:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={percentage} className="flex-1" />
                        <span className={`text-sm font-medium ${colorClass}`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {location.address && (
                      <div className="pt-2 border-t">
                        <span className="text-sm text-gray-500">العنوان:</span>
                        <p className="text-sm mt-1">{location.address}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLocation(location)}
                        className="flex-1"
                        disabled={updateLocationMutation.isLoading}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                        className="flex-1 text-red-600 hover:text-red-700"
                        disabled={deleteLocationMutation.isLoading}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد مواقع تطابق البحث' : 'لا توجد مواقع مسجلة'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'تعديل الموقع' : 'إضافة موقع جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation ? 'تعديل بيانات الموقع المحدد' : 'إضافة موقع تخزين جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationNumber">رقم الموقع</Label>
              <Input 
                id="locationNumber" 
                value={formData.number}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName">اسم الموقع <span className="text-red-600">*</span></Label>
              <Input 
                id="locationName" 
                placeholder="أدخل اسم الموقع"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationType">نوع الموقع <span className="text-red-600">*</span></Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
                disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الموقع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">مخزن</SelectItem>
                  <SelectItem value="shelf">رف</SelectItem>
                  <SelectItem value="section">قسم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">السعة القصوى <span className="text-red-600">*</span></Label>
              <Input 
                id="capacity" 
                type="number" 
                placeholder="أدخل السعة القصوى"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({...prev, capacity: e.target.value}))}
                disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentUsage">المخزون الحالي</Label>
              <Input 
                id="currentUsage" 
                type="number" 
                placeholder="أدخل المخزون الحالي"
                value={formData.currentUsage}
                onChange={(e) => setFormData(prev => ({...prev, currentUsage: e.target.value}))}
                disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea 
                id="address" 
                placeholder="أدخل عنوان الموقع (اختياري)"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveLocation}
              className="w-full sm:w-auto"
              disabled={addLocationMutation.isLoading || updateLocationMutation.isLoading}
            >
              {addLocationMutation.isLoading || updateLocationMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingLocation ? 'جاري التحديث...' : 'جاري الإضافة...'}
                </>
              ) : (
                editingLocation ? 'حفظ التعديل' : 'إضافة الموقع'
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
              هل أنت متأكد من حذف هذا الموقع؟
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setLocationToDelete(null);
              }}
              className="w-full sm:w-auto"
              disabled={deleteLocationMutation.isLoading}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="w-full sm:w-auto"
              disabled={deleteLocationMutation.isLoading}
            >
              {deleteLocationMutation.isLoading ? (
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