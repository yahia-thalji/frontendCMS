import { useState } from 'react';
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
import { Plus, Search, Edit, Trash2, MapPin, Warehouse, Archive } from 'lucide-react';
import { mockLocations } from '@/data/mockData';
import { Location } from '@/types';
import { AutoNumberGenerator } from '@/lib/autoNumber';

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAddLocation = () => {
    setEditingLocation(null);
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    setLocations(locations.filter(location => location.id !== locationId));
  };

  const totalCapacity = locations.reduce((sum, location) => sum + location.capacity, 0);
  const totalUsed = locations.reduce((sum, location) => sum + location.currentStock, 0);
  const utilizationRate = Math.round((totalUsed / totalCapacity) * 100);

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

      {/* إحصائيات سريعة */}
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
                placeholder="البحث باسم الموقع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلتر حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="warehouse">مخزن</SelectItem>
                <SelectItem value="shelf">رف</SelectItem>
                <SelectItem value="section">قسم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول المواقع */}
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
                <TableHead>الوصف</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => {
                const Icon = getLocationIcon(location.type);
                const percentage = getCapacityPercentage(location.currentStock, location.capacity);
                const colorClass = getCapacityColor(percentage);
                
                return (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">LOC-2024-{location.id.padStart(3, '0')}</TableCell>
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
                      {location.currentStock.toLocaleString('ar')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Progress value={percentage} className="w-16" />
                        <span className={`text-sm font-medium ${colorClass}`}>
                          {percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {location.description || 'لا يوجد وصف'}
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
                          onClick={() => handleDeleteLocation(location.id)}
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

      {/* نافذة إضافة/تعديل الموقع */}
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
                value={editingLocation ? `LOC-2024-${editingLocation.id.padStart(3, '0')}` : AutoNumberGenerator.generateLocationNumber()}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName">اسم الموقع</Label>
              <Input id="locationName" placeholder="أدخل اسم الموقع" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationType">نوع الموقع</Label>
              <Select>
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
              <Label htmlFor="capacity">السعة القصوى</Label>
              <Input id="capacity" type="number" placeholder="أدخل السعة القصوى" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentStock">المخزون الحالي</Label>
              <Input id="currentStock" type="number" placeholder="أدخل المخزون الحالي" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" placeholder="أدخل وصف الموقع (اختياري)" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {editingLocation ? 'حفظ التعديل' : 'إضافة الموقع'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}