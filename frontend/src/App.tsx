import React, { useState } from 'react';
import type { DynastyView } from './components/TopBar';
import { DynastyDashboardPage } from './pages/DynastyDashboardPage';
import { OffseasonPage } from './pages/OffseasonPage';
import { RosterPage } from './pages/RosterPage';
import { useDynastyDashboard } from './hooks/useDynastyDashboard';

export default function App() {
  const dashboard = useDynastyDashboard();
  const [activeView, setActiveView] = useState<DynastyView>('overview');

  if (activeView === 'roster') {
    return <RosterPage {...dashboard} activeView={activeView} onNavigate={setActiveView} />;
  }

  if (activeView === 'offseason') {
    return <OffseasonPage {...dashboard} activeView={activeView} onNavigate={setActiveView} />;
  }

  return <DynastyDashboardPage {...dashboard} activeView={activeView} onNavigate={setActiveView} />;
}
