

import React, { useState, useMemo, ChangeEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { ManagedAccount, OrnamentalGold, AuditLogEntry } from '../types';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table, { Column } from '../components/common/Table';
import Button from '../components/common/Button';
import JalaliDatePicker from '../components/common/JalaliDatePicker';
import Select from '../components/common/Select';
import { formatCurrency, formatNumber, formatShortDate, formatDate } from '../utils/formatters';
import { getTodayRange, getThisWeekRange, getThisMonthRange, toYMD, getStartOfDay, getEndOfDay } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { AccessDenied } from '../App';
import AccountLedgerModal from '../components/reports/AccountLedgerModal';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';


const GeneralReportsView: React.FC = () => {
    const { 
        managedAccounts,
        ornamentalGoldItems,
        getCurrencyById,
    } = useData();
    const [dateRange, setDateRange] = useState(() => getThisMonthRange());
    const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'account' | 'gold' } | null>(null);

    const handleSetDateRangePreset = (range: 'today' | 'week' | 'month') => {
        if (range === 'today') setDateRange(getTodayRange());
        else if (range === 'week') setDateRange(getThisWeekRange());
        else setDateRange(getThisMonthRange());
    };

    const accountColumns: Column<ManagedAccount>[] = [
        { header: 'نام حساب', accessor: 'name', className: 'font-semibold' },
        { header: 'ارز', accessor: (row) => getCurrencyById(row.currencyId)?.code || 'N/A' },
        { header: 'نوع', accessor: (row) => row.isCashAccount ? 'صندوق نقدی' : 'حساب بانکی' },
        { header: 'موجودی فعلی', accessor: (row) => <span className="font-bold">{formatCurrency(row.balance, getCurrencyById(row.currencyId)?.code)}</span> },
    ];
    
    const goldColumns: Column<OrnamentalGold>[] = [
        { header: 'کد', accessor: 'code', className: 'font-mono' },
        { header: 'نام', accessor: 'name' },
        { header: 'وزن (گرم)', accessor: (row) => formatNumber(row.weight) },
        { header: 'وضعیت', accessor: (row) => row.status === 'available' 
            ? <span className="text-green-600 dark:text-green-400">موجود</span> 
            : <span className="text-red-600 dark:text-red-400">فروخته شده</span>
        },
        { header: 'تاریخ افزودن', accessor: (row) => formatShortDate(row.addedAt) },
    ];
    
    return (
        <div className="space-y-8">
            <Card>
                <div className="p-4 border-b dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <JalaliDatePicker label="از تاریخ" value={toYMD(dateRange.start)} onChange={(dateStr) => setDateRange(prev => ({...prev, start: new Date(dateStr)}))} containerClassName="mb-0 flex-grow" />
                        <JalaliDatePicker label="تا تاریخ" value={toYMD(dateRange.end)} onChange={(dateStr) => setDateRange(prev => ({...prev, end: new Date(dateStr)}))} containerClassName="mb-0 flex-grow" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleSetDateRangePreset('today')}>امروز</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSetDateRangePreset('week')}>این هفته</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSetDateRangePreset('month')}>این ماه</Button>
                    </div>
                </div>
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    برای مشاهده دفتر حساب (ریز گردش)، روی ردیف مورد نظر در جداول زیر کلیک کنید. گزارش دفتر حساب بر اساس بازه زمانی انتخاب شده در بالا نمایش داده می‌شود.
                </p>
            </Card>

            <Card title="موجودی حساب‌های ارزی">
                <div className="overflow-x-auto">
                    <Table<ManagedAccount>
                    columns={accountColumns}
                    data={managedAccounts.sort((a,b) => a.name.localeCompare(b.name))}
                    keyExtractor={(row) => row.id}
                    onRowClick={(row) => setSelectedItem({ id: row.id, type: 'account' })}
                    />
                </div>
            </Card>

            <Card title="موجودی طلای زینتی">
                <div className="overflow-x-auto">
                    <Table<OrnamentalGold>
                    columns={goldColumns}
                    data={ornamentalGoldItems}
                    keyExtractor={(row) => row.id}
                    onRowClick={(row) => setSelectedItem({ id: row.id, type: 'gold' })}
                    />
                </div>
            </Card>

            {selectedItem && (
                <AccountLedgerModal 
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                    dateRange={dateRange}
                />
            )}
        </div>
    );
};

const AuditLogView: React.FC = () => {
    const { auditLogs, users, getUserById } = useData();
    
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        userId: '',
        entity: '',
    });

    const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFilterDateChange = (name: 'startDate' | 'endDate', value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', userId: '', entity: '' });
    };

    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => {
            if (filters.startDate && new Date(log.timestamp) < getStartOfDay(new Date(filters.startDate))) return false;
            if (filters.endDate && new Date(log.timestamp) > getEndOfDay(new Date(filters.endDate))) return false;
            if (filters.userId && log.userId !== filters.userId) return false;
            if (filters.entity && log.entity !== filters.entity) return false;
            return true;
        });
    }, [auditLogs, filters]);

    const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.username })), [users]);
    const entityOptions = useMemo(() => {
        const entityLabels: Record<string, string> = {
            Transaction: 'تراکنش',
            Customer: 'مشتری',
            User: 'کاربر',
            Currency: 'ارز',
            ManagedAccount: 'حساب داخلی',
            CustomerLedger: 'دفتر حساب مشتری',
            PersonalExpense: 'هزینه شخصی',
            Application: 'سیستم',
            Task: 'کار',
            OrnamentalGold: 'طلای زینتی',
        };
        const entities = new Set(auditLogs.map(log => log.entity));
        return Array.from(entities).map(e => ({ value: e, label: entityLabels[e] || e }));
    }, [auditLogs]);
    
    const logColumns: Column<AuditLogEntry>[] = [
        { header: 'زمان', accessor: (row) => formatDate(row.timestamp), className: 'text-xs whitespace-nowrap' },
        { header: 'کاربر', accessor: (row) => getUserById(row.userId)?.username || row.userId },
        { header: 'عملیات', accessor: 'action' },
        { header: 'موجودیت', accessor: 'entity' },
        { header: 'شرح', accessor: 'details', className: 'min-w-[300px]' },
    ];
    
     return (
        <Card>
            <div className="p-4 border-b dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <JalaliDatePicker label="از تاریخ" value={filters.startDate} onChange={(date) => handleFilterDateChange('startDate', date)} containerClassName="mb-0"/>
                <JalaliDatePicker label="تا تاریخ" value={filters.endDate} onChange={(date) => handleFilterDateChange('endDate', date)} containerClassName="mb-0"/>
                <Select label="کاربر" name="userId" value={filters.userId} onChange={handleFilterChange} options={userOptions} placeholder="همه کاربران" containerClassName="mb-0"/>
                <Select label="موجودیت" name="entity" value={filters.entity} onChange={handleFilterChange} options={entityOptions} placeholder="همه موارد" containerClassName="mb-0"/>
                <div className="flex items-end">
                    <Button variant="danger" onClick={clearFilters} className="w-full">پاک کردن فیلترها</Button>
                </div>
            </div>
            <div className="p-4 flex justify-end gap-2">
                <Button onClick={() => exportToCsv('audit-log', logColumns, filteredLogs)} variant="ghost" size="sm">خروجی CSV</Button>
                <Button onClick={() => exportToPdf('audit-log', 'گزارش حسابرسی', logColumns, filteredLogs)} variant="ghost" size="sm">خروجی PDF</Button>
            </div>
            <div className="overflow-x-auto">
                <Table<AuditLogEntry>
                    columns={logColumns}
                    data={filteredLogs}
                    keyExtractor={(row) => row.id}
                />
            </div>
        </Card>
    );
};

const ReportsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'audit'>('reports');

  if (!hasPermission('view_reports') && !hasPermission('view_audit_log')) {
    return <AccessDenied />;
  }

  return (
    <div>
      <PageHeader title="گزارشات" />
      
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                {hasPermission('view_reports') && (
                    <button onClick={() => setActiveTab('reports')} className={`${activeTab === 'reports' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        گزارشات عمومی
                    </button>
                )}
                {hasPermission('view_audit_log') && (
                    <button onClick={() => setActiveTab('audit')} className={`${activeTab === 'audit' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        گزارش حسابرسی
                    </button>
                )}
            </nav>
        </div>

        <div>
            {activeTab === 'reports' && hasPermission('view_reports') && <GeneralReportsView />}
            {activeTab === 'audit' && hasPermission('view_audit_log') && <AuditLogView />}
        </div>
    </div>
  );
};

export default ReportsPage;