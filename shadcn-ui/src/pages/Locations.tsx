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
import { Plus, Search, Edit, Trash2, MapPin, Warehouse, Archive, AlertTriangle } from 'lucide-react';
import { Location } from '@/types';
import { generateLocationNumber } from '@/lib/autoNumber';
import { SupabaseLocationsStorage } from '@/lib/supabaseStorage';

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    message: string;
    relatedEntities?: Array<{ type: string; count: number; items: string[] }>;
  } | null>(null);

  const [formData, setFormData] = useState({
    locationNumber: '',
    name: '',
    type: '' as Location['type'] | '',
    capacity: '',
    currentUsage: '',
    address: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await SupabaseLocationsStorage.getAll();
      setLocations(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = SupabaseLocationsStorage.subscribe((newLocations) => {
      setLocations(newLocations);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredLocations = locations.filter(location =>
    location?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationIcon = (type: Location['type']) => {
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

  const getTypeLabel = (type: Location['type']) => {
    const labels = {
      warehouse: 'مخزن',
      shelf: 'رف',
      section: 'قسم',
    };
    return labels[type];
  };

  const getCapacityPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const resetForm = () => {
    setFormData({
      locationNumber: '',
      name: '',
      type: '',
      capacity: '',
      currentUsage: '',
      address: ''
    });
  };

  const handleAddLocation = async () => {
    setEditingLocation(null);
    resetForm();
    const locationNumber = await generateLocationNumber();
    setFormData(prev => ({
      ...prev,
      locationNumber
    }));
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      locationNumber: location?.locationNumber || '',
      name: location?.name || '',
      type: location?.type || 'warehouse',
      capacity: (location?.capacity || 0).toString(),
      currentUsage: (location?.currentUsage || 0).toString(),
      address: location?.address || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!formData.name || !formData.type || !formData.capacity) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const locationData = {
        locationNumber: formData.locationNumber,
        name: formData.name,
        type: formData.type as Location['type'],
        capacity: parseInt(formData.capacity) || 0,
        currentUsage: parseInt(formData.currentUsage) || 0,
        address: formData.address
      };

      if (editingLocation) {
        await SupabaseLocationsStorage.update(editingLocation.id, locationData);
      } else {
        await SupabaseLocationsStorage.add(locationData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في حفظ الموقع:', error);
      alert('حدث خطأ أثناء حفظ الموقع');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    setLocationToDelete(locationId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      const result = await SupabaseLocationsStorage.delete(locationToDelete);
      
      if (result.success) {
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
        setDeleteError(null);
      } else {
        setDeleteError({
          message: result.message,
          relatedEntities: result.relatedEntities
        });
      }
    } catch (error) {
      console.error('خطأ في حذف الموقع:', error);
      setDeleteError({
        message: 'حدث خطأ أثناء حذف الموقع'
      });
    }
  };

  const totalCapacity = locations.reduce((sum, location) => sum + (location?.capacity || 0), 0);
  const totalUsed = locations.reduce((sum, location) => sum + (location?.currentUsage || 0), 0);
  const utilizationRate = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

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
          <h1 className="text-3xl font-bold text-gray-900">إدارة مواقع التخزين</h1>
          <p className="text-gray-600 mt-2">إدارة جميع مواقع التخزين والمخازن</p>
        </div>
        <Button onClick={handleAddLocation} className="flex items-center">
          <Plus className="h-4 w-4 ml-2" />
          إضافة موقع جديد
        </Button>
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
        <CardHeader>
          <CardTitle>البحث والفلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث باسم الموقع..."
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
            <MapPin className="h-5 w-5 ml-2" />
            قائمة المواقع ({filteredLocations.length})
          </CardTitle>
          <CardDescription>جميع مواقع التخزين المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
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
                const Icon = getLocationIcon(location?.type || 'warehouse');
                const percentage = getCapacityPercentage(location?.currentUsage || 0, location?.capacity || 1);
                const colorClass = getCapacityColor(percentage);
                
                return (
                  <TableRow key={location?.id}>
                    <TableCell className="font-medium">{location?.locationNumber || 'غير محدد'}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 ml-2 text-gray-500" />
                        {location?.name || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(location?.type || 'warehouse')}</Badge>
                    </TableCell>
                    <TableCell>{(location?.capacity || 0).toLocaleString('ar')}</TableCell>
                    <TableCell className={colorClass}>
                      {(location?.currentUsage || 0).toLocaleString('ar')}
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLocation(location?.id || '')}
                          className="text-red-600 hover:text-red-700"
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'تعديل الموقع' : 'إضافة موقع جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation ? 'تعديل بيانات الموقع المحدد' : 'إضافة موقع تخزين جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationNumber">رقم الموقع</Label>
              <Input 
                id="locationNumber" 
                value={formData.locationNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName">اسم الموقع *</Label>
              <Input 
                id="locationName" 
                placeholder="أدخل اسم الموقع"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationType">نوع الموقع *</Label>
              <Select value={formData.type} onValueChange={(value: Location['type']) => setFormData(prev => ({...prev, type: value}))}>
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
              <Label htmlFor="capacity">السعة القصوى *</Label>
              <Input 
                id="capacity" 
                type="number" 
                placeholder="أدخل السعة القصوى"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({...prev, capacity: e.target.value}))}
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
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea 
                id="address" 
                placeholder="أدخل عنوان الموقع (اختياري)"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveLocation}>
              {editingLocation ? 'حفظ التعديل' : 'إضافة الموقع'}
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
          
          {deleteError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>لا يمكن الحذف</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{deleteError.message}</p>
                {deleteError.relatedEntities && deleteError.relatedEntities.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {deleteError.relatedEntities.map((entity, index) => (
                      <div key={index} className="bg-red-50 p-3 rounded">
                        <p className="font-semibold text-sm mb-1">
                          {entity.type} ({entity.count})
                        </p>
                        <ul className="text-xs space-y-1">
                          {entity.items.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                          {entity.count > 5 && (
                            <li className="text-gray-600">... و {entity.count - 5} أخرى</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteError(null);
                setLocationToDelete(null);
              }}
            >
              إلغاء
            </Button>
            {!deleteError && (
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
              >
                تأكيد الحذف
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}