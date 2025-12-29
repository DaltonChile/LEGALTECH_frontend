import { Outlet } from 'react-router-dom';
import { Sidebar } from '../admin/dashboard/Sidebar';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 font-sans text-slate-900">
      {/* Persistent Sidebar */}
      <Sidebar />
      
      {/* Dynamic Content Area */}
      <main className="flex-1 p-4 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto space-y-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}