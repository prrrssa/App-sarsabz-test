

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME, LOGO_ICON_PATH, DashboardIcon, TransactionsIcon, CustomersIcon, ReportsIcon, SettingsIcon, PersonalExpenseIcon, SparklesIcon, AssistantIcon } from '../../constants';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  id?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick, id }) => (
  <NavLink
    to={to}
    id={id}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
       ${isActive 
         ? 'bg-accent-500 text-white shadow-lg' 
         : 'text-gray-100 hover:bg-primary-600 hover:text-white'
       }`
    }
  >
    <span className="ml-3">{icon}</span>
    {label}
  </NavLink>
);

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen }) => {
  const { hasPermission } = useAuth();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768) { // md breakpoint
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile view */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <div className={`
        w-64 bg-primary-700 dark:bg-primary-800 text-white flex-shrink-0 flex flex-col shadow-lg 
        fixed md:relative top-0 h-full z-40
        rtl:right-0 rtl:border-l-2 rtl:border-accent-600
        ltr:left-0 ltr:border-r-2 ltr:border-accent-600
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full'}
        md:translate-x-0
      `} id="tour-sidebar">
        <div className="flex flex-col items-center p-4 mt-2 mb-3 border-b border-primary-600 dark:border-primary-700">
          <img src={LOGO_ICON_PATH} alt={`${APP_NAME} آیکون`} className="w-20 h-20 mb-2 rounded-full border-2 border-accent-400/50 p-1" />
          <h1 className="text-xl font-semibold text-white">{APP_NAME}</h1>
        </div>
        <nav className="space-y-2 px-4 flex-grow">
          {hasPermission('view_dashboard') && <NavItem to="/dashboard" icon={<DashboardIcon className="w-5 h-5"/>} label="داشبورد" onClick={handleLinkClick} id="tour-dashboard-link"/>}
          {hasPermission('view_transactions') && <NavItem to="/transactions" icon={<TransactionsIcon className="w-5 h-5"/>} label="تراکنش‌ها" onClick={handleLinkClick} id="tour-transactions-link" />}
          {hasPermission('view_customers') && <NavItem to="/customers" icon={<CustomersIcon className="w-5 h-5"/>} label="مشتریان" onClick={handleLinkClick} />}
          <NavItem to="/assistant" icon={<AssistantIcon className="w-5 h-5"/>} label="دستیار هوشمند" onClick={handleLinkClick} />
          {hasPermission('view_ornamental_gold') && <NavItem to="/ornamental-gold" icon={<SparklesIcon className="w-5 h-5"/>} label="طلای زینتی" onClick={handleLinkClick} />}
          {(hasPermission('view_tasks') || true) && <NavItem to="/personal-affairs" icon={<PersonalExpenseIcon className="w-5 h-5"/>} label="امور شخصی و کارها" onClick={handleLinkClick} id="tour-tasks-link"/>}
          {(hasPermission('view_reports') || hasPermission('view_audit_log')) && <NavItem to="/reports" icon={<ReportsIcon className="w-5 h-5"/>} label="گزارشات" onClick={handleLinkClick} />}
          {(hasPermission('manage_users') || hasPermission('manage_currencies') || hasPermission('manage_internal_accounts')) && (
            <NavItem to="/settings" icon={<SettingsIcon className="w-5 h-5"/>} label="تنظیمات" onClick={handleLinkClick} />
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;