/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { AlertCenter } from './components/AlertCenter';
import { RescueTrack } from './components/RescueTrack';
import { CreateRequest } from './components/CreateRequest';
import { SupportConfirmed } from './components/SupportConfirmed';
import { View } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onViewChange={setCurrentView} />;
      case 'alerts':
        return <AlertCenter onViewChange={setCurrentView} />;
      case 'track':
        return <RescueTrack onViewChange={setCurrentView} />;
      case 'request':
        return <CreateRequest onViewChange={setCurrentView} />;
      case 'confirmed':
        return <SupportConfirmed onViewChange={setCurrentView} />;
      default:
        return <HomeView onViewChange={setCurrentView} />;
    }
  };

  const showSidebar = currentView !== 'request' && currentView !== 'confirmed';

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
      <TopBar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex pt-20">
        {showSidebar && <Sidebar currentView={currentView} onViewChange={setCurrentView} />}
        
        <main className={`flex-1 p-8 transition-all duration-300 ${showSidebar ? 'md:ml-64' : 'ml-0'}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}
