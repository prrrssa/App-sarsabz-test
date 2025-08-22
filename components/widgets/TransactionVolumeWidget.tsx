
import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../common/Card';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Chart } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { WIDGETS } from './widgetRegistry';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any, colorStart: string, colorEnd: string) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
};

const TransactionVolumeWidget: React.FC = () => {
    const { transactions } = useData();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#E5E7EB' : '#374151';

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { ticks: { color: textColor, font: { family: 'Vazirmatn' } }, grid: { color: gridColor } },
            x: { ticks: { color: textColor, font: { family: 'Vazirmatn' } }, grid: { color: 'transparent' } },
        },
    }), [isDark, textColor, gridColor]);

    const transactionVolumeData = useMemo(() => {
        const labels: string[] = [];
        const dailyCounts = new Map<string, number>();
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayString = d.toISOString().split('T')[0];
            labels.push(new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d));
            dailyCounts.set(dayString, 0);
        }

        transactions.forEach(t => {
            const dayString = new Date(t.date).toISOString().split('T')[0];
            if (dailyCounts.has(dayString)) {
                dailyCounts.set(dayString, dailyCounts.get(dayString)! + 1);
            }
        });

        return {
            labels,
            datasets: [{
                label: 'تعداد تراکنش‌ها',
                data: Array.from(dailyCounts.values()),
                backgroundColor: (context: { chart: Chart }) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    return createGradient(ctx, chartArea, 'rgba(202, 138, 4, 0.1)', 'rgba(202, 138, 4, 0.7)');
                },
                borderColor: '#ca8a04',
                borderWidth: 2,
                borderRadius: 4,
            }]
        };
    }, [transactions]);

    return (
        <Card title={WIDGETS.transactionVolume.title}>
            <div className="h-80 relative">
                <Bar options={chartOptions as any} data={transactionVolumeData} />
            </div>
        </Card>
    );
};

export default TransactionVolumeWidget;
