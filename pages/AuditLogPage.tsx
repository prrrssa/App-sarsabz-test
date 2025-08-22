


import React, { useState, useMemo, ChangeEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { AuditLogEntry } from '../types';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table, { Column } from '../components/common/Table';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import JalaliDatePicker from '../components/common/JalaliDatePicker';
import { AccessDenied } from '../App';
import { formatDate } from '../utils/formatters';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { getStartOfDay, getEndOfDay } from '../utils/dateUtils';

const AuditLogPage: React.FC = () => {
    const { auditLogs, users, getUserById } = useData();
    const { hasPermission } = useAuth();
    
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

    if (!hasPermission('view_audit_log')) {
        return <AccessDenied />;
    }

    return (
        <div>
            <PageHeader title="گزارش حسابرسی سیستم" />
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
        </div>
    );
};

export default AuditLogPage;