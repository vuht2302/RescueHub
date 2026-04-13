import React from 'react';
import { motion } from 'motion/react';
import { 
  CloudLightning, 
  Package, 
  CheckCircle2, 
  Info, 
  Radio, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Alert, View } from '../types';

interface AlertCenterProps {
  onViewChange: (view: View) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ onViewChange }) => {
  const alerts: Alert[] = [
    {
      id: '1',
      title: 'Severe Weather Warning',
      description: 'Flash flood watch issued for Sector 7-B. Seek higher ground within the next 45 minutes. Avoid riverbanks.',
      time: '10:42 AM',
      type: 'weather',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Supply Drop Dispatched',
      description: 'Medical supplies and thermal blankets are en route to Zone C. Estimated drop time: 09:30 AM.',
      time: '08:15 AM',
      type: 'supply',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Request Resolved',
      description: 'The extraction request for Sector 4-A has been marked as completed. All personnel accounted for.',
      time: 'Yesterday, 06:20 PM',
      type: 'resolved',
      priority: 'low'
    },
    {
      id: '4',
      title: 'Network Maintenance',
      description: 'Satellite relay maintenance completed. High-speed data link restored across all quadrants.',
      time: 'Yesterday, 02:00 PM',
      type: 'maintenance',
      priority: 'low'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'weather': return <CloudLightning className="text-amber-600" />;
      case 'supply': return <Package className="text-sky-600" />;
      case 'resolved': return <CheckCircle2 className="text-emerald-600" />;
      case 'maintenance': return <Info className="text-slate-500" />;
      default: return <Info className="text-slate-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'weather': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'supply': return 'bg-sky-100 dark:bg-sky-900/30';
      case 'resolved': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'maintenance': return 'bg-slate-200 dark:bg-slate-800';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-black font-headline tracking-tighter text-on-surface mb-2">Alert Center</h1>
        <p className="text-on-surface-variant font-medium text-lg">Real-time rescue coordination and system updates.</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse status-glow"></span>
          Priority: Immediate Action
        </h2>
        <div className="bg-error-container/30 border border-error/20 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6 shadow-sm">
          <div className="bg-error text-on-error w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
            <AlertCircle size={36} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-2xl font-black font-headline tracking-tight text-on-error-container">Rescue team is 2 minutes away</h3>
              <span className="text-sm font-bold text-error">CRITICAL</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed mb-4">Aerial extraction unit "Vanguard-1" has localized your signal. Clear a 10m landing zone immediately. Turn on all beacons.</p>
            <div className="flex gap-3">
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm shadow-sm hover:brightness-110 transition-all">Acknowledge Status</button>
              <button className="bg-surface-container-lowest text-on-surface px-6 py-3 rounded-lg font-bold text-sm shadow-sm">Share Location</button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-bold font-headline mb-6 text-on-surface">Today</h2>
          <div className="space-y-4">
            {alerts.slice(0, 2).map((alert) => (
              <motion.div 
                key={alert.id}
                whileHover={{ x: 4 }}
                className="group bg-surface-container-lowest hover:bg-surface-container-low transition-all p-5 rounded-2xl flex gap-5 items-start cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgColor(alert.type)}`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-lg text-on-surface">{alert.title}</h4>
                    <span className="text-xs font-semibold text-on-surface-variant">{alert.time}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-snug">{alert.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold font-headline text-on-surface">Yesterday</h2>
            <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
          </div>
          <div className="space-y-4 opacity-80">
            {alerts.slice(2).map((alert) => (
              <div 
                key={alert.id}
                className="bg-surface-container-low/50 p-5 rounded-2xl flex gap-5 items-start"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgColor(alert.type)}`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-lg text-on-surface">{alert.title}</h4>
                    <span className="text-xs font-semibold text-on-surface-variant">{alert.time}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-snug">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 bg-primary text-on-primary p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
        <div className="relative z-10 max-w-md">
          <h3 className="font-headline font-black text-2xl mb-2">Need Direct Comms?</h3>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">Connect directly with the local dispatch commander for your current quadrant.</p>
          <button className="bg-on-primary text-primary px-8 py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center gap-2">
            <Radio size={20} />
            Start Secure Radio
          </button>
        </div>
        <Radio className="absolute -right-8 -bottom-8 text-white opacity-10 rotate-12" size={240} />
      </div>
    </div>
  );
};
