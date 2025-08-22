

import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import Modal from '../common/Modal';
import { ManagedAccount, OrnamentalGold } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Table, { Column } from '../common/Table';
import { getStartOfDay } from '../../utils/dateUtils';
import Button from '../common/Button';
import { exportToCsv, exportToPdf } from '../../utils/exportUtils';
import Card from '../common/Card';

interface AccountLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; type: 'account' | 'gold' };
  dateRange: { start: Date; end: Date };
}

type LedgerEvent = {
    date: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance?: number;
};

const AccountLedgerModal: React.FC<AccountLedgerModalProps> = ({ isOpen, onClose, item, dateRange }) => {
    const { 
        getManagedAccountById,
        getOrnamentalGoldItemById,
        getCurrencyById,
        getCustomerById,
        getUserById,
        transactions,
        customerLedger,
        personalExpenses,
        accountAdjustments
    } = useData();

    const selectedAccount = useMemo(() => item.type === 'account' ? getManagedAccountById(item.id) : null, [item, getManagedAccountById]);
    const selectedGoldItem = useMemo(() => item.type === 'gold' ? getOrnamentalGoldItemById(item.id) : null, [item, getOrnamentalGoldItemById]);
    const currency = useMemo(() => selectedAccount ? getCurrencyById(selectedAccount.currencyId) : null, [selectedAccount, getCurrencyById]);
    
    const { startingBalance, events } = useMemo(() => {
        if (!selectedAccount) return { startingBalance: 0, events: [] };

        const periodStart = getStartOfDay(dateRange.start);
        
        let balance = 0;
        const allEvents: LedgerEvent[] = [];

        // 1. Calculate Starting Balance by processing all events BEFORE the period start
        transactions.forEach(tx => {
            if (new Date(tx.date) < periodStart) {
                if(tx.targetAccountId === selectedAccount.id) balance += tx.targetAmount;
                if(tx.sourceAccountId === selectedAccount.id) balance -= tx.sourceAmount;
            }
        });
        customerLedger.forEach(entry => {
            if (new Date(entry.date) < periodStart && entry.managedAccountId === selectedAccount.id) {
                balance += entry.amount;
            }
        });
        personalExpenses.forEach(exp => {
            if (new Date(exp.date) < periodStart && exp.managedAccountId === selectedAccount.id) {
                balance -= exp.amount;
            }
        });
        accountAdjustments.forEach(adj => {
             if (new Date(adj.timestamp) < periodStart && adj.accountId === selectedAccount.id) {
                 balance += adj.adjustmentAmount;
             }
        });
        
        const startingBalance = balance;
        
        // 2. Collect all events WITHIN the period
        transactions.forEach(tx => {
            if (new Date(tx.date) >= dateRange.start && new Date(tx.date) <= dateRange.end) {
                 if(tx.targetAccountId === selectedAccount.id) allEvents.push({ date: tx.date, description: `انتقال داخلی از حساب ${getManagedAccountById(tx.sourceAccountId!)?.name || 'نامشخص'} - تراکنش #${tx.transactionNumber}`, credit: tx.targetAmount, debit: 0});
                 if(tx.sourceAccountId === selectedAccount.id) allEvents.push({ date: tx.date, description: `انتقال داخلی به حساب ${getManagedAccountById(tx.targetAccountId!)?.name || 'نامشخص'} - تراکنش #${tx.transactionNumber}`, credit: 0, debit: tx.sourceAmount});
            }
        });
        customerLedger.forEach(entry => {
            if (new Date(entry.date) >= dateRange.start && new Date(entry.date) <= dateRange.end && entry.managedAccountId === selectedAccount.id) {
                allEvents.push({ date: entry.date, description: entry.description, credit: entry.amount > 0 ? entry.amount : 0, debit: entry.amount < 0 ? Math.abs(entry.amount) : 0 });
            }
        });
        personalExpenses.forEach(exp => {
            if (new Date(exp.date) >= dateRange.start && new Date(exp.date) <= dateRange.end && exp.managedAccountId === selectedAccount.id) {
                allEvents.push({ date: exp.date, description: `هزینه شخصی: ${exp.description}`, credit: 0, debit: exp.amount });
            }
        });
        accountAdjustments.forEach(adj => {
            if (new Date(adj.timestamp) >= dateRange.start && new Date(adj.timestamp) <= dateRange.end && adj.accountId === selectedAccount.id) {
                allEvents.push({ date: adj.timestamp, description: `اصلاح دستی: ${adj.reason}`, credit: adj.adjustmentAmount > 0 ? adj.adjustmentAmount : 0, debit: adj.adjustmentAmount < 0 ? Math.abs(adj.adjustmentAmount) : 0 });
            }
        });
        
        allEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // 3. Calculate running balance
        let runningBalance = startingBalance;
        const eventsWithRunningBalance = allEvents.map(event => {
            runningBalance += event.credit - event.debit;
            return { ...event, runningBalance };
        });

        return { startingBalance, events: eventsWithRunningBalance };

    }, [selectedAccount, dateRange, transactions, customerLedger, personalExpenses, accountAdjustments]);

    const ledgerColumns: Column<LedgerEvent>[] = [
        { header: 'تاریخ', accessor: (row) => formatDate(row.date), className: 'text-xs whitespace-nowrap' },
        { header: 'شرح', accessor: 'description', className: 'min-w-[250px]' },
        { header: 'بدهکار (-)', accessor: (row) => row.debit > 0 ? <span className="text-red-500">{formatCurrency(row.debit, currency?.code)}</span> : '---' },
        { header: 'بستانکار (+)', accessor: (row) => row.credit > 0 ? <span className="text-green-500">{formatCurrency(row.credit, currency?.code)}</span> : '---' },
        { header: 'مانده', accessor: (row) => <span className="font-semibold">{formatCurrency(row.runningBalance, currency?.code)}</span> },
    ];
    
    const handleExport = (format: 'csv' | 'pdf') => {
        const title = `دفتر حساب: ${selectedAccount?.name}`;
        if (format === 'csv') {
            exportToCsv(`ledger-${selectedAccount?.id}`, ledgerColumns, events);
        } else {
            exportToPdf(`ledger-${selectedAccount?.id}`, title, ledgerColumns, events);
        }
    }

    if (!selectedAccount && !selectedGoldItem) return null;

    const renderAccountLedger = () => (
        <>
            <Card title="خلاصه" className="mb-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">موجودی اولیه</p>
                        <p className="text-lg font-bold">{formatCurrency(startingBalance, currency?.code)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">تغییر خالص در دوره</p>
                        <p className={`text-lg font-bold ${ (selectedAccount!.balance - startingBalance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(selectedAccount!.balance - startingBalance, currency?.code)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">موجودی پایانی</p>
                        <p className="text-lg font-bold">{formatCurrency(selectedAccount!.balance, currency?.code)}</p>
                    </div>
                 </div>
            </Card>
            <Card title="ریز گردش" actions={
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleExport('csv')}>CSV</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExport('pdf')}>PDF</Button>
                </div>
            }>
                <Table<LedgerEvent>
                    columns={ledgerColumns}
                    data={events}
                    keyExtractor={(row, idx) => `${row.date}-${idx}`}
                />
            </Card>
        </>
    );

    const renderGoldLedger = () => {
        if (!selectedGoldItem) return null;
        const saleTransaction = selectedGoldItem.soldTransactionId ? transactions.find(t => t.id === selectedGoldItem.soldTransactionId) : null;
        return (
            <Card title="تاریخچه قطعه">
                <div className="space-y-4 p-4">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">ایجاد قطعه</span>
                        <span>{formatDate(selectedGoldItem.addedAt)} توسط {getUserById(selectedGoldItem.addedByUserId)?.username}</span>
                    </div>
                    {saleTransaction && (
                         <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-700">
                            <span className="font-semibold text-red-600">فروش</span>
                            <div>
                                <p>{formatDate(saleTransaction.date)} به مشتری {getCustomerById(saleTransaction.customerId!)?.name}</p>
                                <p className="text-xs text-gray-500">شماره تراکنش: {saleTransaction.transactionNumber}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        );
    }
    
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`دفتر حساب: ${selectedAccount?.name || selectedGoldItem?.name}`}
            size="5xl"
        >
            {item.type === 'account' ? renderAccountLedger() : renderGoldLedger()}
        </Modal>
    );
};

export default AccountLedgerModal;
