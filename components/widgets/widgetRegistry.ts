

import React from 'react';
import StatCardsWidget from './StatCardsWidget';
import TransactionVolumeWidget from './TransactionVolumeWidget';
import CustomerGrowthWidget from './CustomerGrowthWidget';
import InventoryCompositionWidget from './InventoryCompositionWidget';
import TopTradedCurrenciesWidget from './TopTradedCurrenciesWidget';
import CurrencyBalancesWidget from './CurrencyBalancesWidget';
import RecentTransactionsWidget from './RecentTransactionsWidget';
import LiveRatesWidget from './LiveRatesWidget';
import CalculatorWidget from './CalculatorWidget';


export interface WidgetConfig {
  component: React.FC<any>;
  title: string;
}

export const WIDGETS: Record<string, WidgetConfig> = {
  statCards: { component: StatCardsWidget, title: 'آمار کلی' },
  currencyBalances: { component: CurrencyBalancesWidget, title: 'موجودی ارزها' },
  transactionVolume: { component: TransactionVolumeWidget, title: 'حجم تراکنش (۳۰ روز گذشته)' },
  customerGrowth: { component: CustomerGrowthWidget, title: 'رشد مشتریان (۶ ماه گذشته)' },
  inventoryComposition: { component: InventoryCompositionWidget, title: 'ترکیب موجودی کل (به ارزش تومانی)' },
  topTradedCurrencies: { component: TopTradedCurrenciesWidget, title: 'ارزهای پرمعامله' },
  recentTransactions: { component: RecentTransactionsWidget, title: 'آخرین تراکنش‌ها' },
  liveRates: { component: LiveRatesWidget, title: 'آخرین نرخ‌ها' },
  calculator: { component: CalculatorWidget, title: 'ماشین حساب' },
};

export const DEFAULT_WIDGET_IDS = [
  'statCards',
  'currencyBalances',
  'transactionVolume',
  'customerGrowth',
  'recentTransactions',
];