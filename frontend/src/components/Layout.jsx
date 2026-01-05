import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Wallet, PieChart, List, CreditCard, LogOut, BarChart, Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import LogoutModal from './LogoutModal';
import clsx from 'clsx';

export default function Layout() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <LogoutModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between px-4 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fintech-600 rounded-lg flex items-center justify-center text-white shadow-md">
                 <Wallet size={16} />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">FinTrack<span className="text-fintech-600">India</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300 p-2">
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-30" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 transform md:relative md:translate-x-0 md:visible pt-16 md:pt-0",
          isMobileMenuOpen ? "translate-x-0 visible" : "-translate-x-full invisible"
      )}>
        <div className="p-6 flex md:flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 hidden">
          <div className="w-10 h-10 bg-fintech-600 rounded-lg flex items-center justify-center text-white shadow-lg">
             <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FinTrack<span className="text-fintech-600">India</span></h1>
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
                    ? "bg-fintech-50 dark:bg-fintech-900/20 text-fintech-600 dark:text-fintech-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
           {/* Theme Toggle */}
           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-2">
               {['light', 'system', 'dark'].map((t) => (
                   <button
                       key={t}
                       onClick={() => setTheme(t)}
                       className={clsx(
                           "flex-1 flex justify-center py-1.5 rounded-md text-gray-500 dark:text-gray-400 transition-all",
                           theme === t && "bg-white dark:bg-gray-600 text-fintech-600 dark:text-fintech-300 shadow-sm"
                       )}
                       title={`Switch to ${t} mode`}
                   >
                       {t === 'light' && <Sun size={16} />}
                       {t === 'dark' && <Moon size={16} />}
                       {t === 'system' && <Monitor size={16} />}
                   </button>
               ))}
           </div>

           <button
             onClick={() => setShowLogoutConfirm(true)}
             className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
           >
             <LogOut size={20} />
             Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
