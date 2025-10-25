import { useState, useEffect } from 'react';
import { Bell, Search, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ItemsStorage, SuppliersStorage, InvoicesStorage, ShipmentsStorage, LocationsStorage } from '@/lib/localStorage';
import { SearchResult, Notification } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // البحث الشامل
  const performSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results: SearchResult[] = [];
    const searchTerm = term.toLowerCase();

    // البحث في الأصناف
    const items = ItemsStorage.getAll();
    items.forEach(item => {
      if (item?.name?.toLowerCase().includes(searchTerm) || 
          item?.referenceNumber?.toLowerCase().includes(searchTerm) ||
          item?.type?.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'item',
          id: item.id,
          title: item.name || 'صنف غير محدد',
          description: `${item.referenceNumber} - ${item.type}`,
          url: '/items'
        });
      }
    });

    // البحث في الموردين
    const suppliers = SuppliersStorage.getAll();
    suppliers.forEach(supplier => {
      if (supplier?.name?.toLowerCase().includes(searchTerm) || 
          supplier?.email?.toLowerCase().includes(searchTerm) ||
          supplier?.phone?.includes(searchTerm)) {
        results.push({
          type: 'supplier',
          id: supplier.id,
          title: supplier.name || 'مورد غير محدد',
          description: `${supplier.email} - ${supplier.phone}`,
          url: '/suppliers'
        });
      }
    });

    // البحث في الفواتير
    const invoices = InvoicesStorage.getAll();
    invoices.forEach(invoice => {
      if (invoice?.invoiceNumber?.toLowerCase().includes(searchTerm)) {
        const supplier = suppliers.find(s => s?.id === invoice.supplierId);
        results.push({
          type: 'invoice',
          id: invoice.id,
          title: invoice.invoiceNumber || 'فاتورة غير محددة',
          description: `${supplier?.name || 'مورد غير محدد'} - ${invoice.totalAmount?.toLocaleString('ar') || '0'} ريال`,
          url: '/invoices'
        });
      }
    });

    // البحث في الشحنات
    const shipments = ShipmentsStorage.getAll();
    shipments.forEach(shipment => {
      if (shipment?.shipmentNumber?.toLowerCase().includes(searchTerm) || 
          shipment?.containerNumber?.toLowerCase().includes(searchTerm) ||
          shipment?.billOfLading?.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'shipment',
          id: shipment.id,
          title: shipment.shipmentNumber || 'شحنة غير محددة',
          description: `${shipment.containerNumber} - ${shipment.status}`,
          url: '/shipping'
        });
      }
    });

    // البحث في المواقع
    const locations = LocationsStorage.getAll();
    locations.forEach(location => {
      if (location?.name?.toLowerCase().includes(searchTerm) || 
          location?.type?.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'location',
          id: location.id,
          title: location.name || 'موقع غير محدد',
          description: `${location.type} - السعة: ${location.capacity}`,
          url: '/locations'
        });
      }
    });

    setSearchResults(results.slice(0, 10)); // أول 10 نتائج
    setShowSearchResults(true);
  };

  // تحديث نتائج البحث عند تغيير النص
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // إنشاء الإشعارات
  const generateNotifications = () => {
    const newNotifications: Notification[] = [];

    // إشعارات المخزون المنخفض
    const items = ItemsStorage.getAll();
    const lowStockItems = items.filter(item => (item?.quantity || 0) < 20);
    
    if (lowStockItems.length > 0) {
      newNotifications.push({
        id: 'low-stock-' + Date.now(),
        type: 'low_stock',
        title: 'مخزون منخفض',
        message: `${lowStockItems.length} صنف يحتاج إعادة تموين`,
        isRead: false,
        createdAt: new Date(),
        priority: 'high'
      });
    }

    // إشعارات الفواتير المتأخرة
    const invoices = InvoicesStorage.getAll();
    const overdueInvoices = invoices.filter(invoice => 
      invoice?.status === 'overdue' || 
      (invoice?.dueDate && new Date(invoice.dueDate) < new Date() && invoice?.status === 'pending')
    );

    if (overdueInvoices.length > 0) {
      newNotifications.push({
        id: 'overdue-invoices-' + Date.now(),
        type: 'overdue_invoice',
        title: 'فواتير متأخرة',
        message: `${overdueInvoices.length} فاتورة تجاوزت تاريخ الاستحقاق`,
        isRead: false,
        createdAt: new Date(),
        priority: 'high'
      });
    }

    // إشعارات الشحنات الواصلة
    const shipments = ShipmentsStorage.getAll();
    const arrivedShipments = shipments.filter(shipment => 
      shipment?.status === 'arrived' || shipment?.status === 'customs'
    );

    if (arrivedShipments.length > 0) {
      newNotifications.push({
        id: 'arrived-shipments-' + Date.now(),
        type: 'shipment_arrived',
        title: 'شحنات واصلة',
        message: `${arrivedShipments.length} شحنة في انتظار المعالجة`,
        isRead: false,
        createdAt: new Date(),
        priority: 'medium'
      });
    }

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.isRead).length);
  };

  // تحديث الإشعارات عند تحميل الصفحة
  useEffect(() => {
    generateNotifications();
    
    // تحديث الإشعارات كل 5 دقائق
    const interval = setInterval(generateNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchResultClick = (result: SearchResult) => {
    navigate(result.url);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    const labels = {
      item: 'صنف',
      supplier: 'مورد',
      invoice: 'فاتورة',
      shipment: 'شحنة',
      location: 'موقع'
    };
    return labels[type];
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'low_stock':
        return '📦';
      case 'overdue_invoice':
        return '⚠️';
      case 'shipment_arrived':
        return '🚛';
      default:
        return '📢';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900">نظام إدارة حاويات الاستيراد</h1>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* مربع البحث الشامل */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="البحث في النظام..."
              className="pr-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm && setShowSearchResults(true)}
            />
            
            {/* نتائج البحث */}
            {showSearchResults && searchResults.length > 0 && (
              <Card className="absolute top-full mt-2 w-80 z-50 max-h-96 overflow-y-auto">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">نتائج البحث</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearchResults(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{result.title}</p>
                            <p className="text-xs text-gray-600">{result.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getResultTypeLabel(result.type)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* الإشعارات */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">الإشعارات</h3>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-xs"
                    >
                      مسح الكل
                    </Button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد إشعارات جديدة</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.createdAt.toLocaleTimeString('ar-SA', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="text-xs p-1 h-auto"
                                >
                                  تم القراءة
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* المستخدم */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-medium">المدير العام</p>
                  <p className="text-sm text-gray-600">admin@company.com</p>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  <Button variant="ghost" className="w-full justify-start" disabled>
                    الملف الشخصي
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" disabled>
                    الإعدادات
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" disabled>
                    تسجيل الخروج
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}