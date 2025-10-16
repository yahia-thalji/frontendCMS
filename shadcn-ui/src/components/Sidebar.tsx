import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  MapPin, 
  Truck, 
  BarChart3,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard' },
  { icon: Package, label: 'الأصناف', path: '/items' },
  { icon: Users, label: 'الموردين', path: '/suppliers' },
  { icon: FileText, label: 'الفواتير', path: '/invoices' },
  { icon: MapPin, label: 'مواقع التخزين', path: '/locations' },
  { icon: Truck, label: 'الشحن', path: '/shipping' },
  { icon: BarChart3, label: 'التقارير', path: '/reports' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-white border-l border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">القائمة الرئيسية</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "px-2"
                )}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "ml-2")} />
                {!isCollapsed && item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}