import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { migrateFromLocalStorage } from '@/lib/cloudStorage';

interface CloudMigrationProps {
  onMigrationComplete: () => void;
}

export default function CloudMigration({ onMigrationComplete }: CloudMigrationProps) {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleMigration = async () => {
    setMigrationStatus('migrating');
    setErrorMessage('');

    try {
      const success = await migrateFromLocalStorage();
      if (success) {
        setMigrationStatus('success');
        setTimeout(() => {
          onMigrationComplete();
        }, 2000);
      } else {
        setMigrationStatus('error');
        setErrorMessage('فشل في نقل البيانات. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      setMigrationStatus('error');
      setErrorMessage('حدث خطأ غير متوقع أثناء النقل.');
      console.error('Migration error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (migrationStatus) {
      case 'migrating':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Cloud className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (migrationStatus) {
      case 'migrating':
        return 'جاري نقل البيانات إلى السحابة...';
      case 'success':
        return 'تم نقل البيانات بنجاح! سيتم إعادة التوجيه...';
      case 'error':
        return errorMessage || 'حدث خطأ أثناء النقل';
      default:
        return 'انقل بياناتك إلى السحابة للوصول من أي مكان';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">تحويل إلى النظام السحابي</CardTitle>
          <CardDescription>
            نقل بياناتك من التخزين المحلي إلى قاعدة البيانات السحابية
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">التخزين المحلي</span>
              <Badge variant="outline">
                <Database className="h-3 w-3 ml-1" />
                نشط
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">التخزين السحابي</span>
              <Badge variant={migrationStatus === 'success' ? 'default' : 'secondary'}>
                <Cloud className="h-3 w-3 ml-1" />
                {migrationStatus === 'success' ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              {getStatusMessage()}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">مميزات النظام السحابي:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• الوصول من أي جهاز وأي مكان</li>
              <li>• مزامنة فورية للبيانات</li>
              <li>• نسخ احتياطية تلقائية</li>
              <li>• أمان وحماية متقدمة</li>
              <li>• مشاركة البيانات مع الفريق</li>
            </ul>
          </div>

          <Button 
            onClick={handleMigration}
            disabled={migrationStatus === 'migrating' || migrationStatus === 'success'}
            className="w-full"
          >
            {migrationStatus === 'migrating' && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            {migrationStatus === 'success' ? 'تم النقل بنجاح' : 'نقل إلى السحابة'}
          </Button>

          {migrationStatus === 'idle' && (
            <Button 
              variant="outline" 
              onClick={onMigrationComplete}
              className="w-full"
            >
              تخطي والبدء بنظام سحابي فارغ
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}