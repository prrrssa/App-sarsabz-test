

import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../common/Card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Chart } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { WIDGETS } from './widgetRegistry';
import { TOMAN_CURRENCY_CODE } from '../../constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any, colorStart: string, colorEnd: string) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
};

const TopTradedCurrenciesWidget: React.FC = () => {
    const { transactions, currencies, getCurrencyById } = useData();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#E5E7EB' : '#374151';

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: { legend: { display: false } },
        scales: {
            y: { ticks: { color: textColor, font: { family: 'Vazirmatn' } }, grid: { color: 'transparent' } },
            x: { ticks: { color: textColor, font: { family: 'Vazirmatn' } }, grid: { color: gridColor } },
        },
    }), [isDark, textColor, gridColor]);

    const topTradedCurrenciesData = useMemo(() => {
        const tomanCurrency = currencies.find(c => c.code === TOMAN_CURRENCY_CODE);
        if (!tomanCurrency) return null;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const volumeByCurrency = new Map<string, number>();
        transactions.forEach(tx => {
            if (new Date(tx.date) < thirtyDaysAgo) return;

            let foreignCurrencyId: string | undefined;
            let volumeInToman = 0;

            if (tx.sourceCurrencyId === tomanCurrency.id) {
                foreignCurrencyId = tx.targetCurrencyId;
                volumeInToman = tx.sourceAmount;
            } else if (tx.targetCurrencyId === tomanCurrency.id) {
                foreignCurrencyId = tx.sourceCurrencyId;
                volumeInToman = tx.targetAmount;
            }

            if (foreignCurrencyId) {
                volumeByCurrency.set(foreignCurrencyId, (volumeByCurrency.get(foreignCurrencyId) || 0) + volumeInToman);
            }
        });

        const sortedVolumes = Array.from(volumeByCurrency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sortedVolumes.length === 0) return null;

        return {
            labels: sortedVolumes.map(([currencyId, _]) => getCurrencyById(currencyId)?.code || 'N/A'),
            datasets: [{
                label: 'حجم معاملات با تومان',
                data: sortedVolumes.map(([_, volume]) => volume),
                backgroundColor: (context: { chart: Chart }) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    return createGradient(ctx, chartArea, 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.7)');
                },
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 4,
            }]
        };
    }, [transactions, currencies, getCurrencyById]);

    return (
        <Card title={WIDGETS.topTradedCurrencies.title}>
            <div className="h-80 relative">
                {topTradedCurrenciesData ? (
                    <Bar options={chartOptions as any} data={topTradedCurrenciesData} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">داده‌ای برای نمایش وجود ندارد.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TopTradedCurrenciesWidget;