import { Outlet } from 'react-router-dom';
import { Sidebar } from '../admin/dashboard/Sidebar';
import { Menu, Bell, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDateProvider } from '../../context/AdminDateContext';


// ============================================
// AdminLayout Content
// ============================================
function AdminLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all duration-200">

        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg md:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>

            {/* Welcome Text */}
            <div className="hidden md:block">
              <h1 className="text-sm font-medium text-slate-500">
                Bienvenido de vuelta, <span className="text-slate-900 font-bold">{firstName}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all md:block hidden">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="w-8 h-8 rounded-full bg-navy-900 p-[2px] cursor-pointer md:hidden">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-navy-900">{firstName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ============================================
// AdminLayout with Provider
// ============================================
export function AdminLayout() {
  return (
    <AdminDateProvider>
      <AdminLayoutContent />
    </AdminDateProvider>
  );
}