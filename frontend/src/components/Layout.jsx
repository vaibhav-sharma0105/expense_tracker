import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, PieChart, List, CreditCard, LogOut, BarChart, Menu, X } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: PieChart, label: 'Dashboard' },
    { to: '/transactions', icon: List, label: 'Transactions' },
    { to: '/cards', icon: CreditCard, label: 'Manage Cards' },
    { to: '/reports', icon: BarChart, label: 'Reports' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fintech-600 rounded-lg flex items-center justify-center text-white shadow-md">
                 <Wallet size={16} />
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">FinTrack<span className="text-fintech-600">India</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 p-2">
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-30" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 md:visible pt-16 md:pt-0",
          isMobileMenuOpen ? "translate-x-0 visible" : "-translate-x-full invisible"
      )}>
        <div className="p-6 flex md:flex items-center gap-3 border-b border-gray-100 hidden">
          <div className="w-10 h-10 bg-fintech-600 rounded-lg flex items-center justify-center text-white shadow-lg">
             <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">FinTrack<span className="text-fintech-600">India</span></h1>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors font-medium",
                  isActive
                    ? "bg-fintech-50 text-fintech-600"
                    : "text-gray-600 hover:bg-gray-50"
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600">
             <LogOut size={20} />
             Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
