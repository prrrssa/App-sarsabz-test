
import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../common/Card';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, Chart } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WIDGETS } from './widgetRegistry';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any, colorStart: string, colorEnd: string) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
};

const CustomerGrowthWidget: React.FC = () => {
    const { customers } = useData();
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

    const customerGrowthData = useMemo(() => {
        const labels: string[] = [];
        const monthlyNewCustomers = new Map<string, number>();
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(d));
            monthlyNewCustomers.set(monthString, 0);
        }

        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        const initialCustomerCount = customers.filter(c => new Date(c.membershipDate) < sixMonthsAgo).length;

        customers.forEach(c => {
            const joinDate = new Date(c.membershipDate);
            if (joinDate >= sixMonthsAgo) {
                const monthString = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyNewCustomers.has(monthString)) {
                    monthlyNewCustomers.set(monthString, monthlyNewCustomers.get(monthString)! + 1);
                }
            }
        });

        const cumulativeData: number[] = [];
        let cumulativeTotal = initialCustomerCount;
        for (const count of monthlyNewCustomers.values()) {
            cumulativeTotal += count;
            cumulativeData.push(cumulativeTotal);
        }

        return {
            labels,
            datasets: [{
                label: 'تعداد کل مشتریان',
                data: cumulativeData,
                fill: true,
                backgroundColor: (context: { chart: Chart }) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    return createGradient(ctx, chartArea, 'rgba(22, 163, 74, 0.05)', 'rgba(22, 163, 74, 0.5)');
                },
                borderColor: '#16a34a',
                tension: 0.4,
            }]
        };
    }, [customers]);

    return (
        <Card title={WIDGETS.customerGrowth.title}>
            <div className="h-80 relative">
                <Line options={chartOptions as any} data={customerGrowthData} />
            </div>
        </Card>
    );
};

export default CustomerGrowthWidget;
