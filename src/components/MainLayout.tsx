import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-neutral-light">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Content of the current page will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout; 