
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Currency, Transaction, Customer, ManagedAccount, CustomerLedgerEntry, User, UserRole, Permission, PersonalExpense, AuditLogEntry, Task, Notification, TaskStatus, TaskPriority, OrnamentalGold, CustomerTier } from './types';
import { TOMAN_CURRENCY_CODE, DEFAULT_USERS, PERSONAL_EXPENSE_CATEGORIES } from './constants';
import useLocalStorage from './hooks/useLocalStorage';
import { formatCurrency } from './utils/formatters';

interface DataContextType {
  currencies: Currency[];
  addCurrency: (currencyData: Pick<Currency, 'code' | 'name' | 'symbol' | 'type'>, userId: string) => void;
  updateCurrency: (currencyData: Pick<Currency, 'id' | 'code' | 'name' | 'symbol' | 'type'>, userId: string) => void;
  deleteCurrency: (currencyId: string, userId: string) => void;
  
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'transactionNumber' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'>, userId: string) => boolean;
  updateTransaction: (updatedTransaction: Transaction, userId: string) => boolean;
  deleteTransaction: (transactionId: string, userId: string) => boolean;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'membershipDate' | 'isFavorite' | 'tier' | 'points'>, userId: string) => Customer;
  updateCustomer: (customer: Customer, userId: string) => void;
  deleteCustomer: (customerId: string, userId: string) => void;

  managedAccounts: ManagedAccount[];
  addManagedAccount: (account: Omit<ManagedAccount, 'id'>, userId: string) => void;
  updateManagedAccount: (account: ManagedAccount, userId: string) => void;
  deleteManagedAccount: (accountId: string, userId: string) => void;

  customerLedger: CustomerLedgerEntry[];
  addCustomerLedgerEntry: (entryData: Omit<CustomerLedgerEntry, 'id' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'>, userId: string) => boolean;
  updateCustomerLedgerEntry: (updatedEntry: CustomerLedgerEntry, userId: string) => boolean;
  deleteCustomerLedgerEntry: (ledgerEntryId: string, userId: string) => boolean;

  personalExpenses: PersonalExpense[];
  addPersonalExpense: (expenseData: Omit<PersonalExpense, 'id' | 'currencyId' | 'lastModifiedByUserId' | 'lastModifiedDate'>, userId: string) => boolean;
  updatePersonalExpense: (updatedExpense: PersonalExpense, userId: string) => boolean;
  deletePersonalExpense: (expenseId: string, userId: string) => boolean;

  users: User[];
  addUser: (userData: Omit<User, 'id'>, userId: string) => boolean;
  updateUser: (userData: User, userId: string) => boolean;
  deleteUser: (userIdToDelete: string, currentUserId: string) => boolean;
  
  auditLogs: AuditLogEntry[];
  dashboardLayouts: { [key: string]: string[] };
  updateDashboardLayout: (userId: string, layout: string[]) => void;

  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>, userId: string) => void;
  updateTask: (updatedTask: Task, userId: string) => void;
  deleteTask: (taskId: string, userId: string) => void;

  ornamentalGoldItems: OrnamentalGold[];
  addOrnamentalGoldItem: (itemData: Omit<OrnamentalGold, 'id' | 'addedAt' | 'status' | 'addedByUserId'>, userId: string) => void;
  updateOrnamentalGoldItem: (itemData: OrnamentalGold, userId: string) => void;
  deleteOrnamentalGoldItem: (itemId: string, userId: string) => void;
  sellOrnamentalGoldItem: (itemId: string, saleData: { customerId: string; sellingPrice: number; notes?: string; date: string; receiptImage?: string; }, userId: string) => boolean;

  notifications: Notification[];
  addNotification: (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;

  tourCompletions: { [key: string]: boolean };
  completeTour: (userId: string) => void;

  getCurrencyById: (id: string) => Currency | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  getManagedAccountById: (id: string) => ManagedAccount | undefined;
  getUserById: (id: string) => User | undefined;
  getOrnamentalGoldItemById: (id: string) => OrnamentalGold | undefined;
  getTotalCurrencyBalance: (currencyId: string) => number;
  loadingData: boolean;
  clearAllApplicationData: (userId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useLocalStorage<Currency[]>('currencies_v4', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions_v7', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers_v3', []);
  const [managedAccounts, setManagedAccounts] = useLocalStorage<ManagedAccount[]>('managedAccounts_v3', []);
  const [customerLedger, setCustomerLedger] = useLocalStorage<CustomerLedgerEntry[]>('customer_ledger_v6', []);
  const [personalExpenses, setPersonalExpenses] = useLocalStorage<PersonalExpense[]>('personal_expenses_v1', []);
  const [users, setUsers] = useLocalStorage<User[]>('users_v2', []); // Version bump for permissions
  const [auditLogs, setAuditLogs] = useLocalStorage<AuditLogEntry[]>('audit_logs_v1', []);
  const [lastTransactionNumber, setLastTransactionNumber] = useLocalStorage<number>('last_tx_number_v1', 0);
  const [dashboardLayouts, setDashboardLayouts] = useLocalStorage<{ [key: string]: string[] }>('dashboard_layouts_v1', {});
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks_v1', []);
  const [ornamentalGoldItems, setOrnamentalGoldItems] = useLocalStorage<OrnamentalGold[]>('ornamental_gold_v1', []);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications_v1', []);
  const [tourCompletions, setTourCompletions] = useLocalStorage<{ [key: string]: boolean }>('tour_completions_v1', {});

  const [loadingData, setLoadingData] = useState(true);

  // Getter functions
  const getCurrencyById = useCallback((id: string) => currencies.find(c => c.id === id), [currencies]);
  const getCustomerById = useCallback((id: string) => customers.find(c => c.id === id), [customers]);
  const getManagedAccountById = useCallback((id: string) => managedAccounts.find(acc => acc.id === id), [managedAccounts]);
  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getOrnamentalGoldItemById = useCallback((id: string) => ornamentalGoldItems.find(i => i.id === id), [ornamentalGoldItems]);
  
  const getTotalCurrencyBalance = useCallback((currencyId: string): number => {
    return managedAccounts
      .filter(acc => acc.currencyId === currencyId)
      .reduce((sum, acc) => sum + acc.balance, 0);
  }, [managedAccounts]);

  const addAuditLog = useCallback((userId: string, action: AuditLogEntry['action'], entity: AuditLogEntry['entity'], details: string) => {
    const newLog: AuditLogEntry = {
      id: `LOG_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      action,
      entity,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [setAuditLogs]);

  const updateDashboardLayout = useCallback((userId: string, layout: string[]) => {
      setDashboardLayouts(prev => ({ ...prev, [userId]: layout }));
      addAuditLog(userId, 'update', 'Application', 'Updated dashboard layout.');
  }, [setDashboardLayouts, addAuditLog]);

  // Seeding useEffect - runs only once if data is not seeded
  useEffect(() => {
    const seeded = localStorage.getItem('seeded_v18_toman'); // Version bump for Toman
    if (!seeded) {
      localStorage.clear();
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(); twoDaysAgo.setDate(today.getDate() - 2);
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(today.getDate() - 3);
      const fourDaysAgo = new Date(); fourDaysAgo.setDate(today.getDate() - 4);
      const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(today.getDate() - 5);
      const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);

      const seededCurrencies: Currency[] = [
        { id: 'C_IRT', code: TOMAN_CURRENCY_CODE, name: 'تومان ایران', symbol: 'تومان', type: 'fiat' },
        { id: 'C_USD', code: 'USD', name: 'دلار آمریکا', symbol: '$', type: 'fiat' },
        { id: 'C_EUR', code: 'EUR', name: 'یورو', symbol: '€', type: 'fiat' },
        { id: 'C_GOLD18K', code: 'GOLD18K', name: 'طلای ۱۸ عیار', symbol: 'گرم', type: 'commodity'},
        { id: 'C_COIN_E', code: 'COIN-E', name: 'سکه امامی', symbol: 'عدد', type: 'commodity'},
      ];
      
      const seededCustomers: Customer[] = [
          { id: 'CUST_01', name: 'علی رضایی', phoneNumber: '09121112233', nationalId: '1234567890', membershipDate: threeDaysAgo.toISOString(), address: 'تهران، خیابان ولیعصر، پلاک ۱۱۰', notes: 'مشتری قدیمی و معتبر', isFavorite: true, tier: CustomerTier.BRONZE, points: 10 },
          { id: 'CUST_02', name: 'مریم حسینی', phoneNumber: '09124445566', nationalId: '0987654321', membershipDate: twoDaysAgo.toISOString(), referrerId: 'CUST_01', isFavorite: false, tier: CustomerTier.BRONZE, points: 0 },
          { id: 'CUST_03', name: 'رضا محمدی', phoneNumber: '09127778899', nationalId: '1122334455', membershipDate: yesterday.toISOString(), address: 'اصفهان، میدان نقش جهان', notes: 'تماس اولیه از طریق وبسایت.', isFavorite: false, tier: CustomerTier.BRONZE, points: 5 },
      ];

      const seededTransactions: Transaction[] = [
        { id: 'TX_01', transactionNumber: 1, sourceAccountId: 'BANK_IRT_01', sourceCurrencyId: 'C_IRT', sourceAmount: 1000000, exchangeRate: 1, targetAccountId: 'CASH_IRT', targetCurrencyId: 'C_IRT', targetAmount: 1000000, date: fiveDaysAgo.toISOString(), createdByUserId: 'admin01', notes: 'انتقال وجه به صندوق' },
        { id: 'TX_02', transactionNumber: 2, customerId: 'CUST_01', sourceCurrencyId: 'C_USD', sourceAmount: 1000, exchangeRate: 58000, targetCurrencyId: 'C_IRT', targetAmount: 57710000, commissionPercentage: 0.5, commissionAmount: 290000, date: fourDaysAgo.toISOString(), createdByUserId: 'acc01', notes: 'خرید دلار نقدی با کارمزد', receiptImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" },
        { id: 'TX_03', transactionNumber: 3, customerId: 'CUST_02', sourceCurrencyId: 'C_IRT', sourceAmount: 32662500, exchangeRate: 1 / 65000, targetCurrencyId: 'C_EUR', targetAmount: 500, commissionPercentage: 0.5, commissionAmount: 162500, date: threeDaysAgo.toISOString(), createdByUserId: 'acc01', notes: 'فروش یورو نقدی با کارمزد' },
        { id: 'TX_04', transactionNumber: 4, customerId: 'CUST_03', sourceCurrencyId: 'C_IRT', sourceAmount: 3451000, exchangeRate: 1 / 340000, targetCurrencyId: 'C_GOLD18K', targetAmount: 10, wagePercentage: 1.5, wageAmount: 51000, date: twoDaysAgo.toISOString(), createdByUserId: 'admin01', notes: 'فروش ۱۰ گرم طلا با اجرت' },
        { id: 'TX_05', transactionNumber: 5, customerId: 'CUST_03', date: yesterday.toISOString(), sourceCurrencyId: 'C_COIN_E', sourceAmount: 2, exchangeRate: 4000000, targetCurrencyId: 'C_IRT', targetAmount: 8000000, createdByUserId: 'admin01', notes: 'خرید ۲ سکه از مشتری (بدون کارمزد)'},
        { id: 'TX_06', transactionNumber: 6, sourceAccountId: 'BANK_USD_01', sourceCurrencyId: 'C_USD', sourceAmount: 5000, exchangeRate: 1, targetAccountId: 'CASH_USD', targetCurrencyId: 'C_USD', targetAmount: 5000, date: yesterday.toISOString(), createdByUserId: 'admin01', notes: 'انتقال دلار به صندوق' },
      ];
      const lastSeededTxNumber = seededTransactions.length > 0 ? Math.max(...seededTransactions.map(t => t.transactionNumber)) : 0;
      
      const seededLedger: CustomerLedgerEntry[] = [
        { id: 'L_DEBIT_TX_02', customerId: 'CUST_01', transactionId: 'TX_02', date: fourDaysAgo.toISOString(), currencyId: 'C_USD', amount: -1000, description: 'بدهی بابت تراکنش #2', createdByUserId: 'acc01' },
        { id: 'L_CREDIT_TX_02', customerId: 'CUST_01', transactionId: 'TX_02', date: fourDaysAgo.toISOString(), currencyId: 'C_IRT', amount: 57710000, description: 'بستانکاری بابت تراکنش #2', createdByUserId: 'acc01' },
        { id: 'L_DEBIT_TX_03', customerId: 'CUST_02', transactionId: 'TX_03', date: threeDaysAgo.toISOString(), currencyId: 'C_IRT', amount: -32662500, description: 'بدهی بابت تراکنش #3', createdByUserId: 'acc01' },
        { id: 'L_CREDIT_TX_03', customerId: 'CUST_02', transactionId: 'TX_03', date: threeDaysAgo.toISOString(), currencyId: 'C_EUR', amount: 500, description: 'بستانکاری بابت تراکنش #3', createdByUserId: 'acc01' },
        { id: 'L_DEBIT_TX_04', customerId: 'CUST_03', transactionId: 'TX_04', date: twoDaysAgo.toISOString(), currencyId: 'C_IRT', amount: -3451000, description: 'بدهی بابت تراکنش #4', createdByUserId: 'admin01'},
        { id: 'L_CREDIT_TX_04', customerId: 'CUST_03', transactionId: 'TX_04', date: twoDaysAgo.toISOString(), currencyId: 'C_GOLD18K', amount: 10, description: 'بستانکاری بابت تراکنش #4', createdByUserId: 'admin01'},
        { id: 'L_DEBIT_TX_05', customerId: 'CUST_03', transactionId: 'TX_05', date: yesterday.toISOString(), currencyId: 'C_COIN_E', amount: -2, description: 'بدهی بابت تراکنش #5', createdByUserId: 'admin01'},
        { id: 'L_CREDIT_TX_05', customerId: 'CUST_03', transactionId: 'TX_05', date: yesterday.toISOString(), currencyId: 'C_IRT', amount: 8000000, description: 'بستانکاری بابت تراکنش #5', createdByUserId: 'admin01'},
        { id: 'L_MANUAL_01', customerId: 'CUST_03', date: yesterday.toISOString(), currencyId: 'C_USD', amount: 2000, description: 'واریز امانی دلار', paymentMethod: 'cash', createdByUserId: 'admin01', receiptImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" },
        { id: 'L_MANUAL_02', customerId: 'CUST_01', date: today.toISOString(), currencyId: 'C_IRT', amount: -57710000, description: 'تسویه بدهی تراکنش #2', paymentMethod: 'account', managedAccountId: 'BANK_IRT_01', createdByUserId: 'acc01' }
      ];

      const seededPersonalExpenses: PersonalExpense[] = [
          { id: 'PEXP_01', userId: 'admin01', date: yesterday.toISOString(), amount: 150000, managedAccountId: 'CASH_IRT', currencyId: 'C_IRT', category: 'خوراک و نوشیدنی', description: 'ناهار کاری با مشتری' },
          { id: 'PEXP_02', userId: 'admin01', date: twoDaysAgo.toISOString(), amount: 80000, managedAccountId: 'BANK_IRT_01', currencyId: 'C_IRT', category: 'حمل و نقل', description: 'اسنپ' },
          { id: 'PEXP_03', userId: 'acc01', date: yesterday.toISOString(), amount: 50000, managedAccountId: 'CASH_IRT', currencyId: 'C_IRT', category: 'لوازم اداری', description: 'خرید کاغذ و خودکار' },
      ];

      let initialManagedAccounts: ManagedAccount[] = [
        { id: 'CASH_IRT', name: 'صندوق تومان', currencyId: 'C_IRT', balance: 0, isCashAccount: true },
        { id: 'CASH_USD', name: 'صندوق دلار آمریکا', currencyId: 'C_USD', balance: 0, isCashAccount: true },
        { id: 'CASH_EUR', name: 'صندوق یورو', currencyId: 'C_EUR', balance: 0, isCashAccount: true },
        { id: 'CASH_GOLD18K', name: 'صندوق طلا ۱۸ عیار', currencyId: 'C_GOLD18K', balance: 0, isCashAccount: true },
        { id: 'CASH_COIN_E', name: 'صندوق سکه امامی', currencyId: 'C_COIN_E', balance: 0, isCashAccount: true },
        { id: 'BANK_IRT_01', name: 'بانک ملی - تومان', currencyId: 'C_IRT', balance: 100000000, accountNumber: '123-456-789', description: 'حساب اصلی تومانی' },
        { id: 'BANK_USD_01', name: 'حساب ارزی - دلار', currencyId: 'C_USD', balance: 100000, accountNumber: '987-654-321', description: 'حساب دلاری' },
      ];

      const accountMap = new Map(initialManagedAccounts.map(a => [a.id, {...a}]));

      // Apply all transactions
      seededTransactions.forEach(tx => {
        if(tx.customerId) {
            const sourceCash = initialManagedAccounts.find(a => a.currencyId === tx.sourceCurrencyId && a.isCashAccount);
            const targetCash = initialManagedAccounts.find(a => a.currencyId === tx.targetCurrencyId && a.isCashAccount);
            if (sourceCash) accountMap.get(sourceCash.id)!.balance += tx.sourceAmount;
            if (targetCash) accountMap.get(targetCash.id)!.balance -= tx.targetAmount;
        } else {
            if(accountMap.has(tx.sourceAccountId!)) accountMap.get(tx.sourceAccountId!)!.balance -= tx.sourceAmount;
            if(accountMap.has(tx.targetAccountId!)) accountMap.get(tx.targetAccountId!)!.balance += tx.targetAmount;
        }
      });
      // Apply manual ledger entries
      seededLedger.forEach(l => {
          if (l.transactionId) return;
          const accountId = l.paymentMethod === 'account' ? l.managedAccountId : initialManagedAccounts.find(a => a.isCashAccount && a.currencyId === l.currencyId)?.id;
          if(accountId && accountMap.has(accountId)) {
              accountMap.get(accountId)!.balance += l.amount;
          }
      });
      // Apply personal expenses
      seededPersonalExpenses.forEach(pe => {
          if(accountMap.has(pe.managedAccountId)) {
              accountMap.get(pe.managedAccountId)!.balance -= pe.amount;
          }
      });

      const seededTasks: Task[] = [
        { id: 'TASK_01', title: 'تهیه گزارش پایان ماه', description: 'تهیه گزارش سود و زیان ماهانه برای مدیریت', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: 'acc01', dueDate: tomorrow.toISOString(), createdByUserId: 'admin01', createdAt: twoDaysAgo.toISOString() },
        { id: 'TASK_02', title: 'تماس با مشتریان بدهکار', description: 'تماس با مشتریانی که بالای ۱۰ میلیون تومان بدهی دارند', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeId: 'acc01', dueDate: tomorrow.toISOString(), createdByUserId: 'admin01', createdAt: yesterday.toISOString() },
        { id: 'TASK_03', title: 'بررسی موجودی صندوق‌ها', description: '', status: TaskStatus.DONE, priority: TaskPriority.LOW, assigneeId: 'admin01', dueDate: yesterday.toISOString(), createdByUserId: 'admin01', createdAt: threeDaysAgo.toISOString() },
      ];

      const seededOrnamentalGold: OrnamentalGold[] = [
        { id: 'OG_01', code: 'N-101', name: 'گردنبند فرشته', weight: 12.5, description: 'گردنبند طلا با آویز طرح فرشته، ساخت ایتالیا', imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIaSURBVHhe7ZtNroMgDEUBF+IOHkSP0I/oQ/QweoKu4s4Ud9AHRfDBSkCj8ZtD2C8LhXzJzcgLBEgYJg3DJGGYNAyThGGSMGwShknCMIkwRKK3524Wj92qVRrf1kXN+8lY/YuZ1w8fHl45Hk/9nZpTj/K8/EtkLOa/u7t7e0d3d/f+d8f5+Pj44/Hk+eYpyzPqL5/4z7l+3u/n3PPO8/n5+eVy+dG4d/sJtRVy/P77P+X/D5/yV2q8387ZqK/e5/l8/vP5/Mvj8aNxf9sW4fK77/F8Ps/L8vL6+vp2o/Abe/3LNYmkvpM0TPLXSHmNq6S6k9S8Z/p/2i1JdSepmR3Gz/+lTNN+dZLkQNJ4G/2HJPuTjO0/aRKGSYNk/Xk3M9Z+/L7N2Cq17+fskYRh0pBMET+Kx5N+2y2aTfs/u22L4uXzS+VyeZg2P/s2bT5IuGwaJg3DJGGYNAyThGGSMGwShknCMIkwTBqGSYIwSRgmCcMkYZg0DJMEYZIwTJKGYdIwbJKGYdIwbJKGYdIwbJKGYdIwbJKGYZIwTJKGYZKw+de426y/XeM2bT5I/b/j2tRGu33nOcM0TNoD6v/MWeu3Nf7f7L9a4z7adMHyf93vJtau/Od5wzTMDkH1P+Zs9Zva/y/2X+1xm3afJCP/dtoleHtfPZtwvX2jXuc8R+Pz/H9l3Q/2QAAAABJRU5ErkJggg==', costPrice: 48750000, status: 'available', addedByUserId: 'admin01', addedAt: threeDaysAgo.toISOString() },
        { id: 'OG_02', code: 'R-205', name: 'انگشتر تک نگین', weight: 6.8, description: 'انگشتر طلا با نگین برلیان اتمی', imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHLSURBVHhe7ZxBaoQwEEQnchcvIsXoR/Qi+hF6Eii5iCt3ES+gLgr+wFwSQ0I47U3Glz+EJJNfbpLdBFmGIUmGIUmGIUmGIUmGIUmGIUmGIUmGIUmGIUmGIBvjTev2c3Z/tW1VfG2fXde8n4h1b8y6/fX19bPl8vnL+bT3ac55w/JcfiCyIdW/vb29tXf39u5/f8f94+Pj1+vl/POZpynPqL9+4j3l+/f+e8555/n8/Py0vLy80vh3+wm1lfL8+vv/lP9/nuWuVbzfzlmob97n+Xz+8/n8y+Xxy0rhv21bhMvvvsfz+TyvLy/Pnz9/udL4hV3/ck0iqe8kDaP8NaS8xlVJdSek5j3T/9O2JNL6TtIyu4yff0uapv3qJI0DyfG2+g9J9icZ23/SNAyTBiFrzzczVt/9vM1YKrXv5+yRhGHSkEwRf4rL5bN+2y2aTft/u21bFC+Xz5eXl5dp87Nv0+aDjMunYZg0DJMEYZIwTBKGSYMwSRgmCcMkYZg0DJMEYZIwTBKGSYMwSRgmCcMkYZg0DJMEYZIwTJKGYdIwbJKGYdIwbJKGYdIwbJKGYdIwbJKGYZIwTJKGYZKw+de426y/XeM2bT5I/b/j2tRGu33nOcM0TNoD6v/MWeu3Nf7f7L9a4z7adMHyf93vJtau/Od5wzTMDkH1P+Zs9Zva/y/2X+1xm3afJCP/dtoleHtfPZtwvX2jXuc8R+Pz/H9l3Q/2QAAAABJRU5ErkJggg==', costPrice: 26520000, status: 'available', addedByUserId: 'admin01', addedAt: yesterday.toISOString() },
      ];

      setCurrencies(seededCurrencies);
      setCustomers(seededCustomers.sort((a,b) => new Date(b.membershipDate).getTime() - new Date(a.membershipDate).getTime()));
      setManagedAccounts(Array.from(accountMap.values()));
      setTransactions(seededTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLastTransactionNumber(lastSeededTxNumber);
      setCustomerLedger(seededLedger.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setPersonalExpenses(seededPersonalExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setUsers(DEFAULT_USERS);
      setTasks(seededTasks);
      setOrnamentalGoldItems(seededOrnamentalGold);
      
      localStorage.setItem('seeded_v18_toman', 'true');
    }
    setLoadingData(false);
  }, []);

  const clearAllApplicationData = (userId: string) => {
    addAuditLog(userId, 'reset', 'Application', `User with ID '${userId}' attempted to clear all application data.`);
    setTimeout(() => {
        localStorage.clear();
        window.location.reload();
    }, 100);
  };

  // --- Notification System ---
    const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
        const newNotification: Notification = {
            id: `NOTIF_${Date.now()}`,
            ...notificationData,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, [setNotifications]);

    const markNotificationAsRead = useCallback((notificationId: string) => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    }, [setNotifications]);

    const markAllNotificationsAsRead = useCallback((userId: string) => {
        setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, isRead: true } : n));
    }, [setNotifications]);

    // Effect to generate notifications for tasks due soon
    useEffect(() => {
        const checkDueTasks = () => {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            tasks.forEach(task => {
                if (task.status === TaskStatus.DONE) return;

                const dueDate = new Date(task.dueDate);
                const isDueToday = dueDate.toDateString() === today.toDateString();
                const isDueTomorrow = dueDate.toDateString() === tomorrow.toDateString();

                if (isDueToday || isDueTomorrow) {
                    const message = `سررسید کار "${task.title}" ${isDueToday ? 'امروز' : 'فردا'} است.`;
                    // Avoid creating duplicate notifications
                    const alreadyNotified = notifications.some(n => n.relatedTaskId === task.id && n.message.includes('سررسید'));
                    if (!alreadyNotified) {
                        addNotification({
                            userId: task.assigneeId,
                            message,
                            relatedTaskId: task.id,
                        });
                    }
                }
            });
        };
        // Run check once a minute
        const intervalId = setInterval(checkDueTasks, 60000);
        return () => clearInterval(intervalId);
    }, [tasks, notifications, addNotification]);

  // --- Tour Functions ---
  const completeTour = useCallback((userId: string) => {
    setTourCompletions(prev => ({...prev, [userId]: true}));
  }, [setTourCompletions]);

  // --- Task Functions ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>, userId: string) => {
      const newTask: Task = {
        id: `TASK_${Date.now()}`,
        status: TaskStatus.TODO,
        createdAt: new Date().toISOString(),
        ...taskData,
        createdByUserId: userId,
      };
      setTasks(prev => [newTask, ...prev]);
      addAuditLog(userId, 'create', 'Task', `Created new task: "${newTask.title}"`);
      addNotification({
          userId: newTask.assigneeId,
          message: `کار جدید "${newTask.title}" توسط ${getUserById(userId)?.username} به شما محول شد.`,
          relatedTaskId: newTask.id,
      });
  };

  const updateTask = (updatedTask: Task, userId: string) => {
      setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
      addAuditLog(userId, 'update', 'Task', `Updated task: "${updatedTask.title}" (Status: ${updatedTask.status})`);
  };

  const deleteTask = (taskId: string, userId: string) => {
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (!taskToDelete) return;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addAuditLog(userId, 'delete', 'Task', `Deleted task: "${taskToDelete.title}"`);
  };

  // --- Ornamental Gold Functions ---
  const addOrnamentalGoldItem = (itemData: Omit<OrnamentalGold, 'id' | 'addedAt' | 'status' | 'addedByUserId'>, userId: string) => {
    const newItem: OrnamentalGold = {
      id: `OG_${Date.now()}`,
      status: 'available',
      addedAt: new Date().toISOString(),
      ...itemData,
      addedByUserId: userId,
    };
    setOrnamentalGoldItems(prev => [newItem, ...prev].sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
    addAuditLog(userId, 'create', 'OrnamentalGold', `Created new ornamental gold item: "${newItem.name}" (${newItem.code})`);
  };

  const updateOrnamentalGoldItem = (itemData: OrnamentalGold, userId: string) => {
      const { soldTransactionId, ...restOfItemData } = itemData; // Avoid overwriting soldTransactionId if not present
      setOrnamentalGoldItems(prev => prev.map(i => i.id === itemData.id ? { ...i, ...restOfItemData, soldTransactionId: itemData.soldTransactionId || i.soldTransactionId } : i));
      addAuditLog(userId, 'update', 'OrnamentalGold', `Updated ornamental gold item: "${itemData.name}" (${itemData.code})`);
  };

  const deleteOrnamentalGoldItem = (itemId: string, userId: string) => {
      const itemToDelete = ornamentalGoldItems.find(i => i.id === itemId);
      if (!itemToDelete) return;
      if (itemToDelete.status === 'sold') {
          alert("امکان حذف قطعه فروخته شده وجود ندارد.");
          return;
      }
      setOrnamentalGoldItems(prev => prev.filter(i => i.id !== itemId));
      addAuditLog(userId, 'delete', 'OrnamentalGold', `Deleted ornamental gold item: "${itemToDelete.name}" (${itemToDelete.code})`);
  };


  // --- Currency Functions ---
  const addCurrency = (currencyData: Pick<Currency, 'code' | 'name' | 'symbol' | 'type'>, userId: string) => {
    const newId = `C_${Date.now()}`;
    const newCurrency: Currency = {
      id: newId,
      code: currencyData.code.toUpperCase(),
      name: currencyData.name,
      symbol: currencyData.symbol,
      type: currencyData.type || 'fiat'
    };
    if (currencies.some(c => c.code === newCurrency.code)) {
        alert(`ارز با کد ${newCurrency.code} قبلاً تعریف شده است.`);
        return;
    }
    const newCashAccount: ManagedAccount = {
        id: `CASH_${newId}`,
        name: `صندوق ${newCurrency.name}`,
        currencyId: newId,
        balance: 0,
        isCashAccount: true
    };
    setCurrencies(prev => [...prev, newCurrency]);
    setManagedAccounts(prev => [...prev, newCashAccount]);
    addAuditLog(userId, 'create', 'Currency', `Created currency ${newCurrency.code} - ${newCurrency.name}.`);
  };
  
  const updateCurrency = (currencyData: Pick<Currency, 'id' | 'code' | 'name' | 'symbol' | 'type'>, userId: string) => {
    setCurrencies(prev => prev.map(c => {
      if (c.id === currencyData.id) {
        if (c.code.toUpperCase() !== currencyData.code.toUpperCase() && prev.some(otherC => otherC.id !== c.id && otherC.code.toUpperCase() === currencyData.code.toUpperCase())) {
            alert(`ارز دیگری با کد ${currencyData.code.toUpperCase()} وجود دارد.`);
            return c; 
        }
        return { ...c, code: currencyData.code.toUpperCase(), name: currencyData.name, symbol: currencyData.symbol, type: currencyData.type || 'fiat' };
      }
      return c;
    }));
    setManagedAccounts(prev => prev.map(acc => {
        if(acc.isCashAccount && acc.currencyId === currencyData.id) {
            return {...acc, name: `صندوق ${currencyData.name}`}
        }
        return acc;
    }));
    addAuditLog(userId, 'update', 'Currency', `Updated currency ${currencyData.code}.`);
  };
  
  const deleteCurrency = (currencyId: string, userId: string) => {
    const currencyToDelete = getCurrencyById(currencyId);
    if (!currencyToDelete) return;

    addAuditLog(userId, 'delete', 'Currency', `Attempted to delete currency '${currencyToDelete.name}'.`);
    if (currencyToDelete.code === TOMAN_CURRENCY_CODE) { alert("امکان حذف ارز تومان وجود ندارد."); return; }
    if (getTotalCurrencyBalance(currencyId) !== 0) { alert("امکان حذف ارز وجود ندارد زیرا موجودی کل آن صفر نیست."); return; }
    if (transactions.some(t => t.sourceCurrencyId === currencyId || t.targetCurrencyId === currencyId)) { alert("امکان حذف ارز وجود ندارد زیرا در تراکنش‌ها استفاده شده است."); return; }
    
    setCurrencies(prev => prev.filter(c => c.id !== currencyId));
    setManagedAccounts(prev => prev.filter(acc => acc.currencyId !== currencyId));
    addAuditLog(userId, 'delete', 'Currency', `Successfully deleted currency '${currencyToDelete.name}'.`);
  };

  // --- Transaction Functions ---
  const applyTransactionEffect = (tx: Transaction) => {
      if (tx.customerId) {
        const sourceCash = managedAccounts.find(a => a.currencyId === tx.sourceCurrencyId && a.isCashAccount);
        const targetCash = managedAccounts.find(a => a.currencyId === tx.targetCurrencyId && a.isCashAccount);
        
        // For ornamental gold sale, target is GOLD18K, but it is an asset leaving, not currency from cashbox.
        if (tx.soldOrnamentalGoldId) {
            if (!sourceCash) throw new Error("صندوق تومان یافت نشد.");
            setManagedAccounts(prev => prev.map(acc => {
                if(acc.id === sourceCash.id) return { ...acc, balance: acc.balance + tx.sourceAmount };
                return acc;
            }));
        } else {
            if (!sourceCash || !targetCash) throw new Error("صندوق‌های نقدی یافت نشد.");
            if (targetCash.balance < tx.targetAmount) {
                alert(`هشدار: موجودی صندوق "${targetCash.name}" کافی نیست. تراکنش ثبت می‌شود و موجودی منفی خواهد شد.`);
            }
            
            setManagedAccounts(prev => prev.map(acc => {
                if (acc.id === sourceCash.id) return { ...acc, balance: acc.balance + tx.sourceAmount };
                if (acc.id === targetCash.id) return { ...acc, balance: acc.balance - tx.targetAmount };
                return acc;
            }));
        }
      } else {
        const sourceAccount = getManagedAccountById(tx.sourceAccountId!);
        const targetAccount = getManagedAccountById(tx.targetAccountId!);
        if (!sourceAccount || !targetAccount) throw new Error("حساب مبدا یا مقصد نامعتبر است.");
        if (sourceAccount.balance < tx.sourceAmount) {
            alert(`هشدار: موجودی حساب "${sourceAccount.name}" کافی نیست. تراکنش ثبت می‌شود و موجودی منفی خواهد شد.`);
        }

        setManagedAccounts(prev => prev.map(acc => {
            if (acc.id === tx.sourceAccountId) return { ...acc, balance: acc.balance - tx.sourceAmount };
            if (acc.id === tx.targetAccountId) return { ...acc, balance: acc.balance + tx.targetAmount };
            return acc;
        }));
      }
  };
  const revertTransactionEffect = (tx: Transaction) => {
    if (tx.customerId) {
        const sourceCash = managedAccounts.find(a => a.currencyId === tx.sourceCurrencyId && a.isCashAccount);
        const targetCash = managedAccounts.find(a => a.currencyId === tx.targetCurrencyId && a.isCashAccount);
        if (tx.soldOrnamentalGoldId) {
            if (sourceCash) setManagedAccounts(prev => prev.map(acc => acc.id === sourceCash.id ? { ...acc, balance: acc.balance - tx.sourceAmount } : acc));
        } else {
            if (sourceCash) setManagedAccounts(prev => prev.map(acc => acc.id === sourceCash.id ? { ...acc, balance: acc.balance - tx.sourceAmount } : acc));
            if (targetCash) setManagedAccounts(prev => prev.map(acc => acc.id === targetCash.id ? { ...acc, balance: acc.balance + tx.targetAmount } : acc));
        }
    } else {
        setManagedAccounts(prev => prev.map(acc => {
            if (acc.id === tx.sourceAccountId) return { ...acc, balance: acc.balance + tx.sourceAmount };
            if (acc.id === tx.targetAccountId) return { ...acc, balance: acc.balance - tx.targetAmount };
            return acc;
        }));
    }
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'transactionNumber' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'>, userId: string): boolean => {
    const newTransactionNumber = lastTransactionNumber + 1;
    const txId = `TX_${Date.now()}`;
    const newTransaction: Transaction = { 
        id: txId,
        transactionNumber: newTransactionNumber,
        ...transactionData, 
        createdByUserId: userId, 
        date: transactionData.date || new Date().toISOString() 
    };
    
    try {
        applyTransactionEffect(newTransaction);
    } catch(e) {
        if (e instanceof Error) alert(e.message);
        return false;
    }
    
    if (newTransaction.customerId) {
      let descriptionText = `تراکنش #${newTransactionNumber}`;
      if (newTransaction.soldOrnamentalGoldId) {
          const item = getOrnamentalGoldItemById(newTransaction.soldOrnamentalGoldId);
          descriptionText = `فروش قطعه ${item?.name || 'زینتی'}`;
      } else {
          const feeText = newTransaction.wageAmount ? ` با اجرت` : newTransaction.commissionAmount ? ` با کارمزد` : '';
          const notesText = newTransaction.notes ? ` (${newTransaction.notes})` : '';
          descriptionText += `${feeText}${notesText}`;
      }

      const debitEntry: CustomerLedgerEntry = { id: `L_DEBIT_${newTransaction.id}`, customerId: newTransaction.customerId, transactionId: newTransaction.id, date: newTransaction.date, currencyId: newTransaction.sourceCurrencyId, amount: -newTransaction.sourceAmount, description: `بدهی بابت ${descriptionText}`, createdByUserId: userId };
      const creditEntry: CustomerLedgerEntry = { id: `L_CREDIT_${newTransaction.id}`, customerId: newTransaction.customerId, transactionId: newTransaction.id, date: newTransaction.date, currencyId: newTransaction.targetCurrencyId, amount: newTransaction.targetAmount, description: `بستانکاری بابت ${descriptionText}`, createdByUserId: userId };
      setCustomerLedger(prev => [debitEntry, creditEntry, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }

    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLastTransactionNumber(newTransactionNumber);
    addAuditLog(userId, 'create', 'Transaction', `Created transaction #${newTransactionNumber}.`);
    
    // Link transaction to ornamental gold if it was a sale
    if(newTransaction.soldOrnamentalGoldId) {
        const item = getOrnamentalGoldItemById(newTransaction.soldOrnamentalGoldId);
        if(item) {
            updateOrnamentalGoldItem({ ...item, status: 'sold', soldTransactionId: newTransaction.id, soldAt: newTransaction.date }, userId);
        }
    }

    return true;
  };

  const updateTransaction = (updatedTransaction: Transaction, userId: string): boolean => {
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!originalTransaction) return false;

    revertTransactionEffect(originalTransaction);
    
    try {
        applyTransactionEffect(updatedTransaction);
    } catch(e) {
        if (e instanceof Error) alert(e.message);
        revertTransactionEffect(updatedTransaction);
        applyTransactionEffect(originalTransaction);
        return false;
    }
    
    setCustomerLedger(prev => prev.filter(l => l.transactionId !== updatedTransaction.id));
    if (updatedTransaction.customerId) {
        const notesText = updatedTransaction.notes ? ` (${updatedTransaction.notes})` : '';
        const feeText = updatedTransaction.wageAmount ? ` با اجرت` : updatedTransaction.commissionAmount ? ` با کارمزد` : '';
        const descriptionText = `تراکنش #${updatedTransaction.transactionNumber}${feeText}${notesText}`;
        const debitEntry: CustomerLedgerEntry = { id: `L_DEBIT_${updatedTransaction.id}`, customerId: updatedTransaction.customerId, transactionId: updatedTransaction.id, date: updatedTransaction.date, currencyId: updatedTransaction.sourceCurrencyId, amount: -updatedTransaction.sourceAmount, description: `بدهی بابت ${descriptionText}`, createdByUserId: updatedTransaction.createdByUserId, lastModifiedByUserId: userId, lastModifiedDate: new Date().toISOString() };
        const creditEntry: CustomerLedgerEntry = { id: `L_CREDIT_${updatedTransaction.id}`, customerId: updatedTransaction.customerId, transactionId: updatedTransaction.id, date: updatedTransaction.date, currencyId: updatedTransaction.targetCurrencyId, amount: updatedTransaction.targetAmount, description: `بستانکاری بابت ${descriptionText}`, createdByUserId: updatedTransaction.createdByUserId, lastModifiedByUserId: userId, lastModifiedDate: new Date().toISOString() };
        setCustomerLedger(prev => [debitEntry, creditEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? {...updatedTransaction, lastModifiedByUserId: userId, lastModifiedDate: new Date().toISOString()} : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addAuditLog(userId, 'update', 'Transaction', `Updated transaction #${updatedTransaction.transactionNumber}.`);
    return true;
  };

  const deleteTransaction = (transactionId: string, userId: string): boolean => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return false;

    // If it was an ornamental gold sale, revert its status
    if (tx.soldOrnamentalGoldId) {
        const item = getOrnamentalGoldItemById(tx.soldOrnamentalGoldId);
        if (item) {
            updateOrnamentalGoldItem({ ...item, status: 'available', soldAt: undefined, soldTransactionId: undefined }, userId);
        }
    }

    revertTransactionEffect(tx);
    setCustomerLedger(prev => prev.filter(l => l.transactionId !== transactionId));
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    addAuditLog(userId, 'delete', 'Transaction', `Deleted transaction #${tx.transactionNumber}.`);
    return true;
  };
  
    const sellOrnamentalGoldItem = (itemId: string, saleData: { customerId: string; sellingPrice: number; notes?: string; date: string; receiptImage?: string; }, userId: string): boolean => {
        const itemToSell = getOrnamentalGoldItemById(itemId);
        const gold18kCurrency = currencies.find(c => c.code === 'GOLD18K');
        const tomanCurrency = currencies.find(c => c.code === TOMAN_CURRENCY_CODE);

        if (!itemToSell || !gold18kCurrency || !tomanCurrency) {
            alert("خطای سیستمی: اطلاعات لازم برای فروش یافت نشد.");
            return false;
        }
        if (itemToSell.status === 'sold') {
            alert("این قطعه قبلا فروخته شده است.");
            return false;
        }

        const transactionPayload: Omit<Transaction, 'id' | 'transactionNumber' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'> = {
            customerId: saleData.customerId,
            sourceCurrencyId: tomanCurrency.id,
            sourceAmount: saleData.sellingPrice,
            targetCurrencyId: gold18kCurrency.id,
            targetAmount: itemToSell.weight,
            exchangeRate: saleData.sellingPrice / itemToSell.weight,
            date: saleData.date,
            notes: `فروش قطعه ${itemToSell.name} (${itemToSell.code}). ${saleData.notes || ''}`.trim(),
            soldOrnamentalGoldId: itemToSell.id,
            receiptImage: saleData.receiptImage,
        };
        
        return addTransaction(transactionPayload, userId);
    };

  // --- Customer Functions ---
  const addCustomer = (customerData: Omit<Customer, 'id' | 'membershipDate' | 'isFavorite' | 'tier' | 'points'>, userId: string): Customer => {
    const newCustomer: Customer = {
      id: `CUST_${Date.now()}`,
      membershipDate: new Date().toISOString(),
      isFavorite: false,
      tier: CustomerTier.BRONZE,
      points: 0,
      ...customerData,
    };
    setCustomers(prev => [newCustomer, ...prev].sort((a,b) => new Date(b.membershipDate).getTime() - new Date(a.membershipDate).getTime()));
    addAuditLog(userId, 'create', 'Customer', `Created customer '${newCustomer.name}'.`);
    return newCustomer;
  };

  const updateCustomer = (customerData: Customer, userId: string) => {
    setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
    addAuditLog(userId, 'update', 'Customer', `Updated customer '${customerData.name}'.`);
  };
  
  const deleteCustomer = (customerId: string, userId: string) => {
    const customer = getCustomerById(customerId);
    if(!customer) return;
    addAuditLog(userId, 'delete', 'Customer', `Attempted to delete customer '${customer.name}'.`);

    if (transactions.some(t => t.customerId === customerId)) {
        alert("امکان حذف مشتری وجود ندارد زیرا در تراکنش‌ها استفاده شده است.");
        return;
    }
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setCustomerLedger(prev => prev.filter(l => l.customerId !== customerId));
    addAuditLog(userId, 'delete', 'Customer', `Successfully deleted customer '${customer.name}'.`);
  };

  // --- Managed Account Functions ---
  const addManagedAccount = (accountData: Omit<ManagedAccount, 'id'>, userId: string) => {
    const newAccount: ManagedAccount = {
      id: `ACC_${Date.now()}`,
      ...accountData,
    };
    setManagedAccounts(prev => [...prev, newAccount]);
    addAuditLog(userId, 'create', 'ManagedAccount', `Created account '${newAccount.name}'.`);
  };
  const updateManagedAccount = (accountData: ManagedAccount, userId: string) => {
    setManagedAccounts(prev => prev.map(a => a.id === accountData.id ? accountData : a));
    addAuditLog(userId, 'update', 'ManagedAccount', `Updated account '${accountData.name}'.`);
  };
  const deleteManagedAccount = (accountId: string, userId: string) => {
    const accountToDelete = getManagedAccountById(accountId);
    if (!accountToDelete) return;
    
    addAuditLog(userId, 'delete', 'ManagedAccount', `Attempted to delete account '${accountToDelete.name}'.`);
    if (accountToDelete && accountToDelete.balance !== 0) {
      alert("امکان حذف حساب وجود ندارد زیرا موجودی آن صفر نیست.");
      return;
    }
    if(personalExpenses.some(pe => pe.managedAccountId === accountId)) {
      alert("امکان حذف حساب وجود ندارد زیرا در هزینه‌های شخصی استفاده شده است.");
      return;
    }
    setManagedAccounts(prev => prev.filter(a => a.id !== accountId));
    addAuditLog(userId, 'delete', 'ManagedAccount', `Successfully deleted account '${accountToDelete.name}'.`);
  };

  // --- Customer Ledger Functions ---
  const applyLedgerEffect = (entry: Omit<CustomerLedgerEntry, 'id'>) => {
    const accountId = entry.paymentMethod === 'account' ? entry.managedAccountId : managedAccounts.find(a => a.currencyId === entry.currencyId && a.isCashAccount)?.id;
    if (!accountId) throw new Error("حساب مربوطه یافت نشد.");
    const account = getManagedAccountById(accountId);
    if (!account) throw new Error("حساب مدیریتی یافت نشد.");
    if (entry.amount < 0 && account.balance < Math.abs(entry.amount)) {
        alert(`هشدار: موجودی حساب ${account.name} برای پرداخت کافی نیست. عملیات ثبت می‌شود و موجودی منفی خواهد شد.`);
    }
    setManagedAccounts(prev => prev.map(acc => acc.id === accountId ? {...acc, balance: acc.balance + entry.amount} : acc));
  };

  const revertLedgerEffect = (entry: CustomerLedgerEntry) => {
    const accountId = entry.paymentMethod === 'account' ? entry.managedAccountId : managedAccounts.find(a => a.currencyId === entry.currencyId && a.isCashAccount)?.id;
    if (accountId) {
      setManagedAccounts(prev => prev.map(acc => acc.id === accountId ? {...acc, balance: acc.balance - entry.amount} : acc));
    }
  };

  const addCustomerLedgerEntry = (entryData: Omit<CustomerLedgerEntry, 'id' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'>, userId: string): boolean => {
    const newEntry: CustomerLedgerEntry = { id: `LEDGER_${Date.now()}`, ...entryData, createdByUserId: userId };
    try { applyLedgerEffect(newEntry); } catch(e) { if (e instanceof Error) alert(e.message); return false; }
    setCustomerLedger(prev => [newEntry, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const customerName = getCustomerById(entryData.customerId)?.name || 'Unknown';
    addAuditLog(userId, 'create', 'CustomerLedger', `Created manual ledger entry for '${customerName}': ${entryData.description}.`);
    return true;
  };
  
  const updateCustomerLedgerEntry = (updatedEntry: CustomerLedgerEntry, userId: string): boolean => {
    const originalEntry = customerLedger.find(l => l.id === updatedEntry.id);
    if (!originalEntry) return false;
    
    if (originalEntry.transactionId) {
        alert("امکان ویرایش مستقیم ردیف‌های سیستمی وجود ندارد. لطفاً تراکنش اصلی را از صفحه تراکنش‌ها ویرایش کنید.");
        return false;
    }
    
    revertLedgerEffect(originalEntry);
    try { 
      applyLedgerEffect(updatedEntry); 
    } catch(e) { 
      if (e instanceof Error) alert(e.message); 
      revertLedgerEffect(updatedEntry); 
      applyLedgerEffect(originalEntry); 
      return false; 
    }
    setCustomerLedger(prev => prev.map(l => l.id === updatedEntry.id ? {...updatedEntry, lastModifiedByUserId: userId, lastModifiedDate: new Date().toISOString()} : l).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addAuditLog(userId, 'update', 'CustomerLedger', `Updated manual ledger entry ID ${updatedEntry.id}.`);
    return true;
  };
  
  const deleteCustomerLedgerEntry = (ledgerEntryId: string, userId: string): boolean => {
    const entry = customerLedger.find(l => l.id === ledgerEntryId);
    if (!entry) return false;

    const customerName = getCustomerById(entry.customerId)?.name || 'Unknown';

    if (entry.transactionId) {
        alert("امکان حذف مستقیم ردیف‌های سیستمی وجود ندارد. برای حذف این ردیف، لطفاً تراکنش اصلی را حذف کنید.");
        return false;
    }

    revertLedgerEffect(entry);
    setCustomerLedger(prev => prev.filter(l => l.id !== ledgerEntryId));
    addAuditLog(userId, 'delete', 'CustomerLedger', `Deleted manual ledger entry ID ${ledgerEntryId} for '${customerName}'.`);
    return true;
  };


  // --- Personal Expense Functions ---
  const addPersonalExpense = (expenseData: Omit<PersonalExpense, 'id' | 'currencyId' | 'lastModifiedByUserId' | 'lastModifiedDate'>, userId: string): boolean => {
    const account = getManagedAccountById(expenseData.managedAccountId);
    if (!account) { alert("حساب یافت نشد."); return false; }
    if (account.balance < expenseData.amount) {
        alert(`هشدار: موجودی حساب "${account.name}" کافی نیست. هزینه ثبت می‌شود و موجودی منفی خواهد شد.`);
    }

    const newExpense: PersonalExpense = {
        id: `PEXP_${Date.now()}`,
        ...expenseData,
        userId,
        currencyId: account.currencyId,
    };
    
    setManagedAccounts(prev => prev.map(acc => acc.id === account.id ? {...acc, balance: acc.balance - expenseData.amount} : acc));
    setPersonalExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addAuditLog(userId, 'create', 'PersonalExpense', `Logged personal expense: ${newExpense.description}.`);
    return true;
  };

  const updatePersonalExpense = (updatedExpense: PersonalExpense, userId: string): boolean => {
    const originalExpense = personalExpenses.find(e => e.id === updatedExpense.id);
    if (!originalExpense) return false;

    const newAccountForCheck = getManagedAccountById(updatedExpense.managedAccountId);
    if (!newAccountForCheck) { alert("حساب جدید یافت نشد."); return false; }
    
    // Calculate what the balance of the new account would be *before* deduction
    let futureBalance = newAccountForCheck.balance;
    if (originalExpense.managedAccountId === updatedExpense.managedAccountId) {
        futureBalance += originalExpense.amount;
    }
    
    if (futureBalance < updatedExpense.amount) {
        alert(`هشدار: موجودی حساب "${newAccountForCheck.name}" کافی نیست. هزینه بروزرسانی می‌شود و موجودی منفی خواهد شد.`);
    }
    
    // Apply changes in one go
    setManagedAccounts(prevAccounts => {
        return prevAccounts.map(acc => {
            let newBalance = acc.balance;
            // Add back original expense amount
            if (acc.id === originalExpense.managedAccountId) {
                newBalance += originalExpense.amount;
            }
            // Deduct new expense amount
            if (acc.id === updatedExpense.managedAccountId) {
                newBalance -= updatedExpense.amount;
            }
            return { ...acc, balance: newBalance };
        });
    });

    const finalExpense: PersonalExpense = {
        ...updatedExpense,
        currencyId: newAccountForCheck.currencyId,
        lastModifiedByUserId: userId,
        lastModifiedDate: new Date().toISOString()
    };

    setPersonalExpenses(prev => prev.map(e => e.id === finalExpense.id ? finalExpense : e).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addAuditLog(userId, 'update', 'PersonalExpense', `Updated personal expense ID ${finalExpense.id}.`);
    return true;
  };

  const deletePersonalExpense = (expenseId: string, userId: string): boolean => {
    const expenseToDelete = personalExpenses.find(e => e.id === expenseId);
    if (!expenseToDelete) return false;

    setManagedAccounts(prev => prev.map(acc => acc.id === expenseToDelete.managedAccountId ? {...acc, balance: acc.balance + expenseToDelete.amount} : acc));
    setPersonalExpenses(prev => prev.filter(e => e.id !== expenseId));
    addAuditLog(userId, 'delete', 'PersonalExpense', `Deleted personal expense ID ${expenseId}.`);
    return true;
  };


  // --- User Functions ---
  const addUser = (userData: Omit<User, 'id'>, userId: string): boolean => {
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        alert("این نام کاربری قبلاً استفاده شده است.");
        return false;
    }
    const newUser: User = { id: `USER_${Date.now()}`, ...userData };
    setUsers(prev => [...prev, newUser]);
    addAuditLog(userId, 'create', 'User', `Created new user '${newUser.username}'.`);
    return true;
  };
  
  const updateUser = (userData: User, userId: string): boolean => {
    setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
    addAuditLog(userId, 'update', 'User', `Updated user '${userData.username}'.`);
    return true;
  };
  
  const deleteUser = (userIdToDelete: string, currentUserId: string): boolean => {
      const userToDelete = getUserById(userIdToDelete);
      if(!userToDelete) return false;
      addAuditLog(currentUserId, 'delete', 'User', `Attempted to delete user '${userToDelete.username}'.`);

      if(userToDelete.role === UserRole.ADMIN && users.filter(u => u.role === UserRole.ADMIN).length <= 1) {
          alert("امکان حذف آخرین کاربر ادمین وجود ندارد.");
          return false;
      }
      setUsers(prev => prev.filter(u => u.id !== userIdToDelete));
      addAuditLog(currentUserId, 'delete', 'User', `Successfully deleted user '${userToDelete.username}'.`);
      return true;
  };

  return (
    <DataContext.Provider value={{
      currencies, addCurrency, updateCurrency, deleteCurrency,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      customers, addCustomer, updateCustomer, deleteCustomer,
      managedAccounts, addManagedAccount, updateManagedAccount, deleteManagedAccount,
      customerLedger, addCustomerLedgerEntry, updateCustomerLedgerEntry, deleteCustomerLedgerEntry,
      personalExpenses, addPersonalExpense, updatePersonalExpense, deletePersonalExpense,
      users, addUser, updateUser, deleteUser,
      auditLogs,
      dashboardLayouts, updateDashboardLayout,
      tasks, addTask, updateTask, deleteTask,
      ornamentalGoldItems, addOrnamentalGoldItem, updateOrnamentalGoldItem, deleteOrnamentalGoldItem, sellOrnamentalGoldItem,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
      tourCompletions, completeTour,
      getCurrencyById, getCustomerById, getManagedAccountById, getUserById, getOrnamentalGoldItemById,
      getTotalCurrencyBalance, loadingData, clearAllApplicationData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
      throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
