
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Transaction } from '../../types';
import Card from '../common/Card';
import Table from '../common/Table';
import { formatShortDate, formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { TransactionsIcon } from '../../constants';

const RecentTransactionsWidget: React.FC = () => {
    const { transactions, getCurrencyById } = useData();
    const recentTransactions = transactions.slice(0, 5);

    const transactionColumns = [
        { header: 'تاریخ', accessor: (row: Transaction) => formatShortDate(row.date), className: 'text-xs' },
        { header: 'ارز مبدا', accessor: (row: Transaction) => getCurrencyById(row.sourceCurrencyId)?.code || 'N/A' },
        { header: 'مقدار مبدا', accessor: (row: Transaction) => formatCurrency(row.sourceAmount, getCurrencyById(row.sourceCurrencyId)?.code) },
        { header: 'نرخ', accessor: (row: Transaction) => formatNumber(row.exchangeRate, 'en-US') },
        { header: 'ارز مقصد', accessor: (row: Transaction) => getCurrencyById(row.targetCurrencyId)?.code || 'N/A' },
        { header: 'مقدار مقصد', accessor: (row: Transaction) => formatCurrency(row.targetAmount, getCurrencyById(row.targetCurrencyId)?.code) },
    ];

    return (
        <Card title="آخرین تراکنش‌ها">
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table<Transaction>
                    columns={transactionColumns}
                    data={recentTransactions}
                    keyExtractor={(row) => row.id}
                />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {recentTransactions.length > 0 ? recentTransactions.map(t => (
                    <div key={t.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/60 dark:border-gray-600 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-primary-600 dark:text-primary-400">{formatDate(t.date)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2 space-x-reverse text-gray-800 dark:text-gray-200">
                                <span className="font-bold">{formatCurrency(t.sourceAmount, getCurrencyById(t.sourceCurrencyId)?.code)}</span>
                                <span>{getCurrencyById(t.sourceCurrencyId)?.code}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <TransactionsIcon className="w-5 h-5 text-accent-500" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">@{formatNumber(t.exchangeRate, 'en-US')}</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-gray-800 dark:text-gray-200">
                                <span className="font-bold">{formatCurrency(t.targetAmount, getCurrencyById(t.targetCurrencyId)?.code)}</span>
                                <span>{getCurrencyById(t.targetCurrencyId)?.code}</span>
                            </div>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 dark:text-gray-400 py-4">تراکنشی یافت نشد.</p>}
            </div>
        </Card>
    );
};

export default RecentTransactionsWidget;
