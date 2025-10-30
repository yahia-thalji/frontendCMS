import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  MapPin, 
  Ship, 
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QuickActions from '@/components/QuickActions';
import Dashboard from './Dashboard';
import Items from './Items';
import Suppliers from './Suppliers';
import Invoices from './Invoices';
import Locations from './Locations';
import Shipping from './Shipping';
import Reports from './Reports';

const menuItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, component: Dashboard },
  { id: 'suppliers', label: 'الموردين', icon: Users, component: Suppliers },
  { id: 'items', label: 'الأصناف', icon: Package, component: Items },
  { id: 'invoices', label: 'الفواتير', icon: FileText, component: Invoices },
  { id: 'locations', label: 'المواقع', icon: MapPin, component: Locations },
  { id: 'shipping', label: 'الشحن', icon: Ship, component: Shipping },
  { id: 'reports', label: 'التقارير', icon: BarChart3, component: Reports },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickActionTrigger, setQuickActionTrigger] = useState<{action: string, timestamp: number} | null>(null);

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || Dashboard;

  const handleQuickAction = (action: string) => {
    // Map actions to tabs and trigger the add dialog
    const actionToTab: Record<string, string> = {
      'add-supplier': 'suppliers',
      'add-item': 'items',
      'add-invoice': 'invoices',
      'add-shipment': 'shipping',
      'add-location': 'locations'
    };

    const targetTab = actionToTab[action];
    if (targetTab) {
      setActiveTab(targetTab);
      // Trigger the action with a timestamp to force re-render
      setQuickActionTrigger({ action, timestamp: Date.now() });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Ship className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">نظام إدارة الحاويات</h1>
                <p className="text-sm text-slate-500">إدارة حاويات الاستيراد</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <QuickActions onAction={handleQuickAction} />
            
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-900">مرحباً بك</p>
                <p className="text-xs text-slate-500">المسؤول</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                م
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-[73px] right-0 h-[calc(100vh-73px)] bg-white border-l border-slate-200 
            transition-all duration-300 z-40 shadow-lg lg:shadow-none
            ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16'}
          `}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${!sidebarOpen && 'lg:mx-auto'}`} />
                  <span className={`font-medium ${!sidebarOpen && 'lg:hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <ActiveComponent quickActionTrigger={quickActionTrigger} />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}