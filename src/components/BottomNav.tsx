import { Map, List, PlusCircle, ScanLine } from 'lucide-react';
import { cn } from '../lib/utils';

export type ViewState = 'map' | 'list' | 'add' | 'scan' | 'edit';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export function BottomNav({ currentView, onChangeView }: BottomNavProps) {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'Karte', icon: <Map className="w-6 h-6" /> },
    { id: 'list', label: 'Liste', icon: <List className="w-6 h-6" /> },
    { id: 'add', label: 'Neu', icon: <PlusCircle className="w-6 h-6" /> },
    { id: 'scan', label: 'Scan', icon: <ScanLine className="w-6 h-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe print:hidden z-[1000]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              currentView === item.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
