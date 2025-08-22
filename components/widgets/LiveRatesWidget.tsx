

import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { TOMAN_CURRENCY_CODE } from '../../constants';
import Card from '../common/Card';
import { WIDGETS } from './widgetRegistry';
import { formatCurrency, formatShortDate } from '../../utils/formatters';

const LiveRatesWidget: React.FC = () => {
    const { transactions, currencies, getCurrencyById } = useData();

    const liveRates = useMemo(() => {
        const tomanCurrency = currencies.find(c => c.code === TOMAN_CURRENCY_CODE);
        if (!tomanCurrency) return [];

        const rates = new Map<string, { rate: number; date: string }>();

        // Iterate from newest to oldest
        [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(tx => {
            let rate: number | undefined;
            let currencyToSet: string | undefined;

            if (tx.sourceCurrencyId === tomanCurrency.id && !rates.has(tx.targetCurrencyId)) {
                currencyToSet = tx.targetCurrencyId;
                rate = 1 / tx.exchangeRate; // e.g. 1 EUR = X IRT
            } else if (tx.targetCurrencyId === tomanCurrency.id && !rates.has(tx.sourceCurrencyId)) {
                currencyToSet = tx.sourceCurrencyId;
                rate = tx.exchangeRate; // e.g. 1 USD = X IRT
            }

            if (currencyToSet && rate) {
                rates.set(currencyToSet, { rate, date: tx.date });
            }
        });

        return Array.from(rates.entries()).map(([currencyId, data]) => ({
            currency: getCurrencyById(currencyId),
            ...data,
        })).filter(item => item.currency && item.currency.id !== tomanCurrency.id);

    }, [transactions, currencies, getCurrencyById]);

    return (
        <Card title={WIDGETS.liveRates.title}>
            <div className="space-y-3 h-80 overflow-y-auto pr-2">
                {liveRates.length > 0 ? liveRates.map(item => (
                    <div key={item.currency!.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{item.currency!.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">آخرین بروزرسانی: {formatShortDate(item.date)}</p>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg text-primary-600 dark:text-primary-400">
                                {formatCurrency(item.rate, TOMAN_CURRENCY_CODE)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">تومان</p>
                        </div>
                    </div>
                )) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">نرخی برای نمایش یافت نشد.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default LiveRatesWidget;