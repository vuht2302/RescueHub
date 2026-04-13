import React from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, 
  Stethoscope, 
  Shield, 
  ArrowRight, 
  MessageSquare, 
  BellPlus,
  MapPin,
  Navigation,
  Wind
} from 'lucide-react';
import { View } from '../types';

interface HomeViewProps {
  onViewChange: (view: View) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onViewChange }) => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Pulse Status Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-1 bg-error-container/20 rounded-full flex items-center gap-3 pr-4 border border-error/10"
      >
        <div className="w-3 h-3 rounded-full bg-error ml-2 pulse-glow"></div>
        <span className="text-error font-bold text-sm tracking-tight font-headline">CRITICAL ALERT: SEVERE WEATHER WARNING IN SECTOR 4</span>
        <span className="ml-auto text-xs text-on-surface-variant font-bold uppercase tracking-widest">Active Now</span>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Center Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Hero Section */}
          <section className="relative h-[480px] rounded-[2rem] overflow-hidden bg-surface-container-lowest shadow-sm flex flex-col items-center justify-center text-center p-12">
            <div className="absolute inset-0 z-0 opacity-10 grayscale hover:opacity-20 transition-opacity duration-700">
              <img 
                className="w-full h-full object-cover" 
                src="https://picsum.photos/seed/map/1200/800" 
                alt="Map Background"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10 max-w-lg">
              <h1 className="text-5xl font-headline font-extrabold text-on-surface leading-tight tracking-tighter mb-4">Need Immediate Assistance?</h1>
              <p className="text-on-surface-variant text-lg mb-12 font-medium">One-tap connection to local emergency dispatchers and nearest volunteer responders.</p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange('confirmed')}
                className="group relative w-72 h-72 rounded-full bg-gradient-to-br from-error to-red-700 flex flex-col items-center justify-center shadow-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-full border-4 border-error opacity-20 group-hover:scale-125 transition-transform duration-700"></div>
                <AlertCircle className="text-white mb-2" size={64} />
                <span className="text-white font-headline font-black text-2xl tracking-tighter uppercase">Request Help</span>
                <span className="absolute -bottom-12 text-error font-bold text-sm animate-bounce">PRESS AND HOLD</span>
              </motion.button>
            </div>
          </section>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low p-8 rounded-[2rem] hover:bg-surface-container-high transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="text-primary" size={32} />
                </div>
                <ArrowRight className="text-outline group-hover:translate-x-1 transition-transform" size={24} />
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-2">First Aid Guide</h3>
              <p className="text-on-surface-variant leading-relaxed">Step-by-step offline instructions for critical trauma response and basic life support.</p>
            </div>

            <div className="bg-surface-container-low p-8 rounded-[2rem] hover:bg-surface-container-high transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center">
                  <Shield className="text-tertiary" size={32} />
                </div>
                <ArrowRight className="text-outline group-hover:translate-x-1 transition-transform" size={24} />
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-2">Safe Zones</h3>
              <p className="text-on-surface-variant leading-relaxed">Live map of verified evacuation centers and supply distribution points in your area.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm flex-1">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-8 tracking-tight">Current Status</h2>
            
            <div className="space-y-10">
              <div className="relative pl-8 border-l-2 border-outline-variant">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest"></div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Your Location</span>
                  <span className="text-xs text-on-surface-variant font-medium">Verified 2m ago</span>
                </div>
                <p className="text-lg font-headline font-bold text-on-surface">Sector 4, Central District</p>
                <p className="text-sm text-on-surface-variant">4 Active units in vicinity</p>
              </div>

              <div className="relative pl-8 border-l-2 border-outline-variant">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-error border-4 border-surface-container-lowest pulse-glow"></div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-error">Incident Nearby</span>
                  <span className="text-xs text-on-surface-variant font-medium">400m Away</span>
                </div>
                <p className="text-lg font-headline font-bold text-on-surface">Structure Hazard</p>
                <p className="text-sm text-on-surface-variant">Response team in transit</p>
              </div>

              <div className="relative pl-8 border-l-2 border-outline-variant">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-tertiary border-4 border-surface-container-lowest"></div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Environment</span>
                  <span className="text-xs text-on-surface-variant font-medium">Updated 5m ago</span>
                </div>
                <p className="text-lg font-headline font-bold text-on-surface">Air Quality: Fair</p>
                <p className="text-sm text-on-surface-variant">Elevated dust particles detected</p>
              </div>
            </div>

            <div className="mt-12 bg-surface-container-low p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  className="w-12 h-12 rounded-full object-cover" 
                  src="https://picsum.photos/seed/sarah/100/100" 
                  alt="Sarah Chen"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-sm font-bold font-headline">Assigned Coordinator</p>
                  <p className="text-xs text-on-surface-variant">Officer Sarah Chen</p>
                </div>
              </div>
              <button className="w-full bg-surface-container-highest py-3 rounded-xl font-bold text-primary flex items-center justify-center gap-2 hover:bg-outline-variant transition-colors">
                <MessageSquare size={18} />
                Connect with Dispatch
              </button>
            </div>
          </div>

          <div className="h-48 rounded-[2.5rem] overflow-hidden relative shadow-sm group cursor-pointer">
            <img 
              className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
              src="https://picsum.photos/seed/livemap/600/400" 
              alt="Live Map"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <span className="text-white text-xs font-bold tracking-widest uppercase mb-1">Live Map</span>
              <span className="text-white font-headline font-bold">Responders Live Tracking</span>
            </div>
          </div>
        </aside>
      </div>

      <button className="fixed bottom-12 right-12 w-20 h-20 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <BellPlus size={32} />
      </button>
    </div>
  );
};
