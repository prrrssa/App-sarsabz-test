
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { formatNumber } from '../../utils/formatters';
import { TransactionsIcon, CustomersIcon } from '../../constants';
import Card from '../common/Card';
import { getTodayRange } from '../../utils/dateUtils';

const StatCardsWidget: React.FC = () => {
    const { transactions, customers } = useData();

    const todayRange = getTodayRange();
    const transactionsToday = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= todayRange.start && transactionDate <= todayRange.end;
    }).length;

    const totalCustomers = customers.length;
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card bodyClassName="!p-0" className="overflow-hidden">
                <div className="flex items-center">
                    <div className="p-5 bg-primary-500 text-white rounded-l-lg"><TransactionsIcon className="w-8 h-8"/></div>
                    <div className="px-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">کل تراکنش‌ها</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatNumber(transactions.length)}</p>
                    </div>
                </div>
            </Card>
            <Card bodyClassName="!p-0" className="overflow-hidden">
                <div className="flex items-center">
                    <div className="p-5 bg-accent-500 text-white rounded-l-lg"><CustomersIcon className="w-8 h-8"/></div>
                    <div className="px-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">کل مشتریان</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatNumber(totalCustomers)}</p>
                    </div>
                </div>
            </Card>
            <Card bodyClassName="!p-0" className="overflow-hidden">
                <div className="flex items-center">
                    <div className="p-5 bg-blue-500 text-white rounded-l-lg"><TransactionsIcon className="w-8 h-8"/></div>
                    <div className="px-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">تراکنش‌های امروز</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatNumber(transactionsToday)}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StatCardsWidget;
