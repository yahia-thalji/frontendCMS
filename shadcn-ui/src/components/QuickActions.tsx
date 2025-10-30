import { Plus, FileText, Package, Ship, Users, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Quick Add Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 ml-2" />
            إجراء سريع
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>الإجراءات السريعة</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onAction('add-supplier')} className="cursor-pointer">
            <Users className="h-4 w-4 ml-2" />
            <span>إضافة مورد جديد</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('add-item')} className="cursor-pointer">
            <Package className="h-4 w-4 ml-2" />
            <span>إضافة صنف جديد</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('add-invoice')} className="cursor-pointer">
            <FileText className="h-4 w-4 ml-2" />
            <span>إنشاء فاتورة جديدة</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('add-shipment')} className="cursor-pointer">
            <Ship className="h-4 w-4 ml-2" />
            <span>تسجيل شحنة جديدة</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('add-location')} className="cursor-pointer">
            <MapPin className="h-4 w-4 ml-2" />
            <span>إضافة موقع تخزين</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('add-currency')} className="cursor-pointer">
            <DollarSign className="h-4 w-4 ml-2" />
            <span>إضافة عملة جديدة</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Individual Quick Action Buttons (Desktop Only) */}
      <div className="hidden xl:flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('add-supplier')}
          className="border-blue-200 hover:bg-blue-50"
        >
          <Users className="h-4 w-4 ml-2" />
          مورد
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('add-item')}
          className="border-green-200 hover:bg-green-50"
        >
          <Package className="h-4 w-4 ml-2" />
          صنف
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('add-invoice')}
          className="border-purple-200 hover:bg-purple-50"
        >
          <FileText className="h-4 w-4 ml-2" />
          فاتورة
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction('add-shipment')}
          className="border-orange-200 hover:bg-orange-50"
        >
          <Ship className="h-4 w-4 ml-2" />
          شحنة
        </Button>
      </div>
    </div>
  );
}