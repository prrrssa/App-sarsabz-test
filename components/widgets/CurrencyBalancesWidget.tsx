
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Currency } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

const CurrencyBalancesWidget: React.FC = () => {
    const { currencies, managedAccounts, getTotalCurrencyBalance } = useData();
    const [isCurrencyModalOpen, setCurrencyModalOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

    const handleCurrencyCardClick = (currency: Currency) => {
        setSelectedCurrency(currency);
        setCurrencyModalOpen(true);
    };

    const relatedManagedAccounts = selectedCurrency
        ? managedAccounts.filter(acc => acc.currencyId === selectedCurrency.id)
        : [];

    return (
        <Card title="موجودی ارزها">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {currencies.map((currency: Currency) => {
                    const totalBalance = getTotalCurrencyBalance(currency.id);
                    return (
                        <div key={currency.id} onClick={() => handleCurrencyCardClick(currency)} className="cursor-pointer group">
                            <Card className="border border-transparent dark:border-gray-700/50 h-full group-hover:shadow-xl dark:hover:shadow-accent-500/10 group-hover:border-accent-300 dark:group-hover:border-accent-600 transition-all duration-300 relative overflow-hidden">
                                <span className="absolute -bottom-4 rtl:-left-4 ltr:-right-4 text-8xl text-gray-500/5 dark:text-gray-300/5 font-bold transition-transform duration-300 group-hover:scale-110" style={{ fontFamily: 'monospace' }}>{currency.symbol}</span>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{currency.name} ({currency.code})</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                                    {formatCurrency(totalBalance, currency.code)}
                                </p>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {selectedCurrency && (
                <Modal
                    isOpen={isCurrencyModalOpen}
                    onClose={() => setCurrencyModalOpen(false)}
                    title={`موجودی تفکیکی: ${selectedCurrency.name} (${selectedCurrency.code})`}
                >
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                موجودی کل: {formatCurrency(getTotalCurrencyBalance(selectedCurrency.id), selectedCurrency.code)} {selectedCurrency.symbol}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-md font-semibold text-primary-600 dark:text-primary-400 border-b pb-1 mb-2">جزئیات موجودی در حساب‌ها</h3>
                            {relatedManagedAccounts.length > 0 ? (
                                relatedManagedAccounts.sort((a, b) => (a.isCashAccount ? -1 : 1) - (b.isCashAccount ? -1 : 1)).map(account => (
                                    <div key={account.id} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-900/50">
                                        <span className="text-gray-700 dark:text-gray-300">{account.name}:</span>
                                        <span className="font-semibold">{formatCurrency(account.balance, selectedCurrency.code)} {selectedCurrency.symbol}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-2">هیچ حساب مدیریتی برای این ارز تعریف نشده است.</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                        <Button variant="ghost" onClick={() => setCurrencyModalOpen(false)}>بستن</Button>
                    </div>
                </Modal>
            )}
        </Card>
    );
};

export default CurrencyBalancesWidget;
