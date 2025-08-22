
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/common/PageHeader';
import { AccessDenied } from '../App';
import { WIDGETS, DEFAULT_WIDGET_IDS } from '../components/widgets/widgetRegistry';
import Button from '../components/common/Button';
import CustomizeDashboardModal from '../components/widgets/CustomizeDashboardModal';
import { WrenchScrewdriverIcon } from '../constants';

const DashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { loadingData, dashboardLayouts } = useData();
  const [isCustomizeModalOpen, setCustomizeModalOpen] = useState(false);

  const userLayout = useMemo(() => {
    if (!user || !dashboardLayouts[user.id]) {
      return DEFAULT_WIDGET_IDS;
    }
    return dashboardLayouts[user.id];
  }, [user, dashboardLayouts]);

  if (loadingData) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div></div>;
  }
  
  if (!hasPermission('view_dashboard')) {
      return <AccessDenied />;
  }

  return (
    <div>
      <PageHeader title="داشبورد مدیریتی">
        <Button onClick={() => setCustomizeModalOpen(true)} variant="ghost" leftIcon={<WrenchScrewdriverIcon className="w-5 h-5"/>}>
          شخصی‌سازی داشبورد
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {userLayout.map(widgetId => {
          const Widget = WIDGETS[widgetId]?.component;
          if (!Widget) return null;
          
          const gridSpanClass = {
              statCards: 'lg:col-span-3',
              currencyBalances: 'lg:col-span-3',
              recentTransactions: 'lg:col-span-3',
              transactionVolume: 'lg:col-span-2',
              inventoryComposition: 'lg:col-span-2',
              // Default span is 1
          }[widgetId] || 'lg:col-span-1';

          return (
            <div key={widgetId} className={gridSpanClass}>
                <Widget />
            </div>
          );
        })}
         {userLayout.length === 0 && (
            <div className="lg:col-span-3 text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">داشبورد شما خالی است.</p>
                <Button onClick={() => setCustomizeModalOpen(true)} className="mt-4">
                    برای افزودن ویجت کلیک کنید
                </Button>
            </div>
        )}
      </div>

      <CustomizeDashboardModal 
        isOpen={isCustomizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
        currentLayout={userLayout}
      />
    </div>
  );
};

export default DashboardPage;
