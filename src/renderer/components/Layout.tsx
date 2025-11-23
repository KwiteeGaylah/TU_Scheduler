import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        {/* Sidebar Toggle Button - positioned at edge of sidebar */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="fixed top-4 z-50 p-3 rounded-r-lg shadow-lg hover:shadow-xl transition-all"
          style={{
            left: sidebarCollapsed ? '0' : '248px',
            backgroundColor: 'var(--amber-honey)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
        >
          {sidebarCollapsed ? '»' : '«'}
        </button>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
