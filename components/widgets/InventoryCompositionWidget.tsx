

import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { WIDGETS } from './widgetRegistry';
import { TOMAN_CURRENCY_CODE } from '../../constants';

ChartJS.register(ArcElement, Tooltip, Legend);

const InventoryCompositionWidget: React.FC = () => {
    const { currencies, transactions, getTotalCurrencyBalance } = useData();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E5E7EB' : '#374151';

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { color: textColor, font: { family: 'Vazirmatn' } }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        let label = context.label || '';
                        if (label) label += ': ';
                        if (context.parsed !== null) {
                            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(2);
                            label += `${formatCurrency(context.parsed, TOMAN_CURRENCY_CODE)} تومان (${percentage}%)`;
                        }
                        return label;
                    }
                }
            }
        }
    }), [textColor]);

    const inventoryCompositionData = useMemo(() => {
        const tomanCurrency = currencies.find(c => c.code === TOMAN_CURRENCY_CODE);
        if (!tomanCurrency) return null;

        const ratesToToman = new Map<string, number>([[tomanCurrency.id, 1]]);
        [...transactions].reverse().forEach(tx => {
            if (tx.sourceCurrencyId === tomanCurrency.id && !ratesToToman.has(tx.targetCurrencyId)) {
                ratesToToman.set(tx.targetCurrencyId, 1 / tx.exchangeRate);
            } else if (tx.targetCurrencyId === tomanCurrency.id && !ratesToToman.has(tx.sourceCurrencyId)) {
                ratesToToman.set(tx.sourceCurrencyId, tx.exchangeRate);
            }
        });

        const dataPoints = currencies
            .map(currency => {
                const totalBalance = getTotalCurrencyBalance(currency.id);
                const rate = ratesToToman.get(currency.id);
                if (!rate || totalBalance === 0) return null;
                return { label: currency.name, value: totalBalance * rate };
            })
            .filter((item): item is { label: string; value: number } => item !== null && item.value > 1);

        if (dataPoints.length === 0) return null;

        const colors = ['#16a34a', '#ca8a04', '#2563eb', '#7c3aed', '#db2777', '#475569'];

        return {
            labels: dataPoints.map(p => p.label),
            datasets: [{
                data: dataPoints.map(p => p.value),
                backgroundColor: dataPoints.map((_, i) => colors[i % colors.length] + 'E6'),
                borderColor: isDark ? '#374151' : '#fff',
                borderWidth: 2,
            }]
        };
    }, [currencies, transactions, getTotalCurrencyBalance, isDark]);

    return (
        <Card title={WIDGETS.inventoryComposition.title}>
            <div className="h-80 relative">
                {inventoryCompositionData ? (
                    <Doughnut options={chartOptions as any} data={inventoryCompositionData} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">داده‌ای برای نمایش ترکیب موجودی وجود ندارد.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default InventoryCompositionWidget;