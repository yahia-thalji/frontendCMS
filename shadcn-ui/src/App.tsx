import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Suppliers from './pages/Suppliers';
import Invoices from './pages/Invoices';
import Locations from './pages/Locations';
import Shipping from './pages/Shipping';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import CloudMigration from './components/CloudMigration';
import { ItemsStorage } from '@/lib/localStorage';

const queryClient = new QueryClient();

const App = () => {
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    // فحص وجود بيانات محلية
    const hasLocalData = ItemsStorage.getAll().length > 0;
    
    // فحص إعدادات المستخدم
    const cloudModePreference = localStorage.getItem('cloudMode');
    
    if (cloudModePreference === 'true') {
      setIsCloudMode(true);
    } else if (hasLocalData && cloudModePreference !== 'false') {
      // إذا كانت هناك بيانات محلية ولم يختر المستخدم بعد
      setShowMigration(true);
    } else {
      // بدء بنظام سحابي فارغ
      setIsCloudMode(true);
      localStorage.setItem('cloudMode', 'true');
    }
  }, []);

  const handleMigrationComplete = () => {
    setIsCloudMode(true);
    setShowMigration(false);
    localStorage.setItem('cloudMode', 'true');
  };

  if (showMigration) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <CloudMigration onMigrationComplete={handleMigrationComplete} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Layout><Dashboard isCloudMode={isCloudMode} /></Layout>} />
            <Route path="/items" element={<Layout><Items isCloudMode={isCloudMode} /></Layout>} />
            <Route path="/suppliers" element={<Layout><Suppliers isCloudMode={isCloudMode} /></Layout>} />
            <Route path="/invoices" element={<Layout><Invoices isCloudMode={isCloudMode} /></Layout>} />
            <Route path="/locations" element={<Layout><Locations isCloudMode={isCloudMode} /></Layout>} />
            <Route path="/shipping" element={<Layout><Shipping isCloudMode={isCloudMode} /></Layout>} />
            <Route path="/reports" element={<Layout><Reports isCloudMode={isCloudMode} /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;