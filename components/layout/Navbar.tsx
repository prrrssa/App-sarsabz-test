import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { LOGO_TEXT_PATH, LogoutIcon, APP_NAME, SunIcon, MoonIcon, BellIcon } from '../../constants';
import Button from '../common/Button';
import NotificationPopover from '../common/NotificationPopover';
import { useData } from '../../contexts/DataContext';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useData();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.userId === user?.id && !n.isRead).length;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md z-20">
      <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile */}
          <button 
            className="text-gray-600 dark:text-gray-300 md:hidden" 
            onClick={toggleSidebar} 
            aria-label="باز کردن منو"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/dashboard" className="flex items-center">
            <img src={LOGO_TEXT_PATH} alt={`${APP_NAME} Logo`} className="h-8 md:h-10" />
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button 
              id="tour-notifications-button"
              onClick={() => setIsNotifOpen(!isNotifOpen)} 
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
              aria-label="اعلان‌ها"
            >
              <BellIcon className="w-5 h-5"/>
              {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
              )}
            </button>
            <NotificationPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>

          <button 
            id="tour-theme-button"
            onClick={toggleTheme} 
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
            aria-label="تغییر تم"
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
          </button>
          
          {user && (
            <>
              <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
                خوش آمدید, {user.username}
              </span>
              <Button id="tour-logout-button" onClick={async () => await logout()} variant="ghost" size="sm" className="hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600">
                <LogoutIcon className="w-5 h-5 md:ml-1"/>
                <span className="hidden md:inline">خروج</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;