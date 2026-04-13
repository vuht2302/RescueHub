import React from 'react';
import { UserCircle, Settings } from 'lucide-react';
import { View } from '../types';

interface TopBarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-8 py-4">
      <div className="flex items-center gap-8">
        <div 
          className="text-2xl font-black text-primary tracking-tighter font-headline cursor-pointer"
          onClick={() => onViewChange('home')}
        >
          RescueGuardian
        </div>
        <div className="hidden md:flex items-center gap-8 font-headline font-bold tracking-tight">
          <button 
            onClick={() => onViewChange('home')}
            className={`pb-1 transition-colors ${currentView === 'home' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-primary'}`}
          >
            Home
          </button>
          <button 
            onClick={() => onViewChange('track')}
            className={`pb-1 transition-colors ${currentView === 'track' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-primary'}`}
          >
            Requests
          </button>
          <button 
            onClick={() => onViewChange('alerts')}
            className={`pb-1 transition-colors ${currentView === 'alerts' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-primary'}`}
          >
            Alerts
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => onViewChange('request')}
          className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2 rounded-lg font-bold transition-all active:scale-95 text-sm"
        >
          Emergency Signal
        </button>
        <div className="flex gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-100/50 rounded-full transition-colors">
            <UserCircle size={24} />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100/50 rounded-full transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};
