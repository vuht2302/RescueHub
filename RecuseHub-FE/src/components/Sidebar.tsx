import React from 'react';
import { 
  LayoutGrid, 
  Map as MapIcon, 
  Zap, 
  Package, 
  BarChart3, 
  AlertTriangle 
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'home', label: 'Map View', icon: MapIcon },
    { id: 'track', label: 'Dispatch', icon: Zap },
    { id: 'resources', label: 'Resources', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex flex-col gap-2 p-4 pt-4 bg-slate-100 dark:bg-slate-900 h-[calc(100vh-80px)] w-64 fixed left-0 border-r border-outline-variant/10">
      <div className="px-2 mb-6">
        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-headline">Command Center</div>
        <div className="text-xs text-on-surface-variant font-medium">Active Session</div>
      </div>
      
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`flex items-center gap-3 px-4 py-3 transition-all font-semibold rounded-lg text-sm ${
              currentView === item.id 
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:translate-x-1'
            }`}
          >
            <item.icon size={20} fill={currentView === item.id ? "currentColor" : "none"} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-2">
        <button 
          onClick={() => onViewChange('request')}
          className="w-full bg-primary py-4 rounded-xl text-on-primary font-bold shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <AlertTriangle size={18} />
          Report Incident
        </button>
      </div>
    </aside>
  );
};
