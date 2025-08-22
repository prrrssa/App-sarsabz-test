import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { Transaction, Currency, Customer, SettlementPayload, ExchangeSettlementPayload, C2CSettlementPayload, CustomerTier, CustomerTierConfig } from '../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table, { Column } from '../components/common/Table';
import Card from '../components/common/Card';
import FormattedNumberInput from '../components/common/FormattedNumberInput';
import { PlusIcon, TransactionsIcon, EditIcon, DeleteIcon, FilterIcon, PaperClipIcon, TOMAN_CURRENCY_CODE, ArrowsUpDownIcon, CheckCircleIcon } from '../constants';
import { formatCurrency, formatDate, formatShortDate, formatNumber } from '../utils/formatters';
import { toYMD, getStartOfDay, getEndOfDay } from '../utils/dateUtils';
import { AccessDenied } from '../App';
import { compressImage } from '../utils/imageUtils';
import ImageViewerModal from '../components/common/ImageViewerModal';
import JalaliDatePicker from '../components/common/JalaliDatePicker';
import AddCustomerModal from '../components/customers/AddCustomerModal';

type FormMode = 'customer_trade' | 'internal';

type SettlementRow = SettlementPayload & {
  id: string; // for react key
};

const TransactionsPage: React.FC = () => {
  const { 
    transactions, addTransaction, updateTransaction, deleteTransaction, 
    currencies, customers, managedAccounts, users, customerLedger,
    getCurrencyById, getCustomerById, getManagedAccountById, getUserById, getOrnamentalGoldItemById,
    customerTierConfig
  } = useData();
  const { user, hasPermission } = useAuth();
  
  // Modal and Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [viewingSettlementReceipt, setViewingSettlementReceipt] = useState<string | null>(null);
  const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerId: '',
    currencyId: '',
    userId: '',
    type: ''
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });

  // Form State
  const [formMode, setFormMode] = useState<FormMode>('customer_trade');
  
  const initialTransactionState = {
    sourceCurrencyId: '', sourceAmount: 0, 
    targetCurrencyId: '', targetAmount: 0,
    sourceAccountId: '', // for internal
    targetAccountId: '', // for internal
    exchangeRate: 1,
    customerId: '', notes: '',
    wagePercentage: 0,
    wageAmount: 0,
    commissionPercentage: 0,
    commissionAmount: 0,
    formDate: toYMD(new Date()),
    receiptImage: undefined as (string | undefined),
  };
  const [formState, setFormState] = useState(initialTransactionState);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  
  const [calculationError, setCalculationError] = useState<string>('');
  const [customerDiscount, setCustomerDiscount] = useState(0);

  useEffect(() => {
    if (formState.customerId) {
        const customer = getCustomerById(formState.customerId);
        const tier = customer?.tier || CustomerTier.BRONZE;
        setCustomerDiscount(customerTierConfig[tier].commissionDiscount); // Use dynamic config
    } else {
        setCustomerDiscount(0);
    }
  }, [formState.customerId, getCustomerById, customerTierConfig]);


  // --- DERIVED STATE ---
  const customerPaysCurrency = useMemo(() => getCurrencyById(formState.sourceCurrencyId), [formState.sourceCurrencyId, getCurrencyById]);
  const customerReceivesCurrency = useMemo(() => getCurrencyById(formState.targetCurrencyId), [formState.targetCurrencyId, getCurrencyById]);
  
  const { remainingSource, remainingTarget } = useMemo(() => {
    if (formMode !== 'customer_trade' || !formState.customerId) {
        return { remainingSource: 0, remainingTarget: 0 };
    }
    const sourceSettled = settlements.reduce((sum, s) => {
        if (s.type === 'exchange') {
            const account = getManagedAccountById(s.managedAccountId);
            if (account?.currencyId === formState.sourceCurrencyId && s.amount > 0) return sum + s.amount;
        } else if (s.type === 'c2c' && s.currencyId === formState.sourceCurrencyId) {
            return sum + s.amount;
        }
        return sum;
    }, 0);
    const targetSettled = settlements.reduce((sum, s) => {
        if (s.type === 'exchange') {
            const account = getManagedAccountById(s.managedAccountId);
            if (account?.currencyId === formState.targetCurrencyId && s.amount < 0) return sum + Math.abs(s.amount);
        } else if (s.type === 'c2c' && s.currencyId === formState.targetCurrencyId) {
            return sum + s.amount;
        }
        return sum;
    }, 0);
    return {
        remainingSource: formState.sourceAmount - sourceSettled,
        remainingTarget: formState.targetAmount - targetSettled
    };
  }, [formState.sourceAmount, formState.targetAmount, formState.sourceCurrencyId, formState.targetCurrencyId, settlements, getManagedAccountById, formMode, formState.customerId]);
  
  // --- FORM CALCULATION LOGIC ---
  const handleSmartFormChange = (
    fieldName: 'sourceAmount' | 'targetAmount' | 'exchangeRate',
    value: number
  ) => {
    setFormState(prev => {
        const newState = { ...prev, [fieldName]: value };
        
        if (fieldName === 'sourceAmount' || fieldName === 'targetAmount') {
            if (newState.sourceAmount > 0 && newState.targetAmount > 0) {
                newState.exchangeRate = newState.targetAmount / newState.sourceAmount;
            }
        } 
        else if (fieldName === 'exchangeRate') {
            if (newState.sourceAmount > 0) {
                newState.targetAmount = newState.sourceAmount * newState.exchangeRate;
            }
        }

        return newState;
    });
  };

  const handleFeeChange = (
    fieldName: 'commissionPercentage' | 'wagePercentage',
    value: number
  ) => {
      setFormState(prev => {
        const newState = { ...prev, [fieldName]: value };
        if (fieldName === 'commissionPercentage') {
          const baseCommission = newState.sourceAmount * (value / 100);
          newState.commissionAmount = baseCommission * (1 - (customerDiscount / 100));
        }
        if (fieldName === 'wagePercentage') {
          const baseWage = newState.sourceAmount * (value / 100);
          newState.wageAmount = baseWage * (1 - (customerDiscount / 100));
        }
        return newState;
      });
  };
  
  // Validation check effect
  useEffect(() => {
    const { sourceAmount, targetAmount, exchangeRate } = formState;
    if (sourceAmount > 0 && targetAmount > 0 && exchangeRate > 0) {
        if (Math.abs(sourceAmount * exchangeRate - targetAmount) > 0.01) { // Epsilon for floating point
            setCalculationError('مقادیر پرداختی، دریافتی و نرخ تبدیل با هم همخوانی ندارند.');
        } else {
            setCalculationError('');
        }
    } else {
        setCalculationError('');
    }
  }, [formState.sourceAmount, formState.targetAmount, formState.exchangeRate]);


  // --- Filter Handlers ---
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };
  
  const handleFilterDateChange = (name: 'startDate' | 'endDate', value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
      setFilters({ startDate: '', endDate: '', customerId: '', currencyId: '', userId: '', type: '' });
      setSearchTerm('');
  };
  
  // --- Form Handlers ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  const handleNumberValueChange = (name: string, value: number) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFormDateChange = (value: string) => {
    setFormState(prev => ({ ...prev, formDate: value }));
  };
  
  const handleReceiptChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const file = e.target.files[0];
            const compressedImage = await compressImage(file);
            setFormState(prev => ({ ...prev, receiptImage: compressedImage }));
        } catch (error) {
            console.error("Error compressing image:", error);
            alert("خطا در پردازش تصویر. لطفاً فایل دیگری را امتحان کنید.");
        }
    }
  };
  
  // --- Modal Open/Close Logic ---
  const openModalForNew = () => {
    setEditingTransaction(null);
    setFormState(initialTransactionState);
    setFormMode('customer_trade');
    setSettlements([]);
    setIsModalOpen(true);
  };
  
  const openModalForEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    
    if (tx.soldOrnamentalGoldId) {
        alert("امکان ویرایش مستقیم تراکنش فروش طلای زینتی وجود ندارد.");
        return;
    }
    
    const mode: FormMode = tx.customerId ? 'customer_trade' : 'internal';
    setFormMode(mode);

    setFormState({
        sourceCurrencyId: tx.sourceCurrencyId, sourceAmount: tx.sourceAmount,
        sourceAccountId: tx.sourceAccountId || '', exchangeRate: tx.exchangeRate,
        targetCurrencyId: tx.targetCurrencyId, targetAmount: tx.targetAmount,
        targetAccountId: tx.targetAccountId || '', customerId: tx.customerId || '',
        notes: tx.notes || '',
        wagePercentage: tx.wagePercentage || 0,
        wageAmount: tx.wageAmount || 0,
        commissionPercentage: tx.commissionPercentage || 0,
        commissionAmount: tx.commissionAmount || 0,
        formDate: toYMD(new Date(tx.date)),
        receiptImage: tx.receiptImage,
    });
    
    const initialSettlements: SettlementRow[] = [];
    const relatedLedgerEntries = customerLedger.filter(l => l.transactionId === tx.id);
    const processedGroupIds = new Set<string>();

    relatedLedgerEntries.forEach(entry => {
        if(entry.managedAccountId && !entry.settlementGroupId) {
             initialSettlements.push({
                id: entry.id,
                type: 'exchange',
                managedAccountId: entry.managedAccountId,
                amount: entry.amount,
                notes: entry.description,
                receiptImage: entry.receiptImage,
            });
        }
        else if (entry.settlementGroupId && !processedGroupIds.has(entry.settlementGroupId)) {
            const partnerEntry = relatedLedgerEntries.find(p => p.settlementGroupId === entry.settlementGroupId && p.id !== entry.id);
            if(partnerEntry) {
                const mainCustomerIsPayer = (entry.customerId === tx.customerId && entry.amount < 0) || (partnerEntry.customerId === tx.customerId && partnerEntry.amount < 0);
                initialSettlements.push({
                    id: entry.settlementGroupId,
                    type: 'c2c',
                    amount: Math.abs(entry.amount),
                    currencyId: entry.currencyId,
                    otherCustomerId: mainCustomerIsPayer ? partnerEntry.customerId : entry.customerId,
                    mainCustomerIsPayer,
                    notes: entry.description,
                    receiptImage: entry.receiptImage,
                });
                processedGroupIds.add(entry.settlementGroupId);
            }
        }
    });

    setSettlements(initialSettlements);
    setIsModalOpen(true);
  };

  const handleDelete = (transactionId: string) => {
    if (window.confirm("آیا از حذف این تراکنش مطمئن هستید؟ تمام ردیف‌های دفتر حساب مرتبط با آن نیز حذف خواهند شد.") && user) {
        deleteTransaction(transactionId, user.id);
    }
  };

  // --- Form Submission ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("کاربر وارد نشده است."); return; }
    
    const localDate = new Date(formState.formDate);
    const timezoneOffset = localDate.getTimezoneOffset() * 60000;
    const dateInISO = new Date(localDate.getTime() - timezoneOffset).toISOString();
    
    let payload: Omit<Transaction, 'id' | 'transactionNumber' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'>;
    if (formMode === 'internal') {
        const sourceAccCurrencyId = getManagedAccountById(formState.sourceAccountId)?.currencyId;
        const targetAccCurrencyId = getManagedAccountById(formState.targetAccountId)?.currencyId;
        
        if (!sourceAccCurrencyId || !targetAccCurrencyId) {
          alert("لطفا حساب مبدا و مقصد را انتخاب کنید.");
          return;
        }

        const calculatedTarget = formState.sourceAmount * formState.exchangeRate;

        payload = {
             sourceCurrencyId: sourceAccCurrencyId,
             sourceAmount: formState.sourceAmount,
             sourceAccountId: formState.sourceAccountId,
             targetCurrencyId: targetAccCurrencyId,
             targetAmount: calculatedTarget, // Recalculate for internal transfer
             targetAccountId: formState.targetAccountId,
             exchangeRate: formState.exchangeRate,
             date: dateInISO,
             notes: formState.notes,
             receiptImage: formState.receiptImage,
        };
    } else { // customer_trade
        payload = {
            customerId: formState.customerId,
            sourceCurrencyId: formState.sourceCurrencyId,
            sourceAmount: formState.sourceAmount,
            targetCurrencyId: formState.targetCurrencyId,
            targetAmount: formState.targetAmount,
            exchangeRate: formState.exchangeRate,
            date: dateInISO,
            notes: formState.notes,
            receiptImage: formState.receiptImage,
            wagePercentage: formState.wagePercentage || undefined,
            wageAmount: formState.wageAmount || undefined,
            commissionPercentage: formState.commissionPercentage || undefined,
            commissionAmount: formState.commissionAmount || undefined,
        };
    }
    
    const success = editingTransaction 
        ? updateTransaction({ ...editingTransaction, ...payload }, user.id) 
        : addTransaction(payload, user.id);

    if (success) { setIsModalOpen(false); }
  };
  
  // --- Settlement Handlers ---
  const addSettlementRow = () => {
    setSettlements(prev => [...prev, {
        id: `S_${Date.now()}`,
        type: 'exchange',
        amount: 0,
        managedAccountId: '',
        notes: '',
        receiptImage: undefined,
    }]);
  };

  const handleSettlementImageChange = async (settlementId: string, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const file = e.target.files[0];
            const compressedImage = await compressImage(file);
            updateSettlement(settlementId, { receiptImage: compressedImage });
        } catch (error) {
            console.error("Error compressing image for settlement:", error);
            alert("خطا در پردازش تصویر. لطفاً فایل دیگری را امتحان کنید.");
        }
    }
  };
  
  const updateSettlement = (id: string, newSettlementData: Partial<SettlementRow>) => {
    setSettlements(prev => prev.map((s): SettlementRow => {
        if (s.id !== id) return s;

        // Handle type change
        if (newSettlementData.type && newSettlementData.type !== s.type) {
            return newSettlementData.type === 'exchange'
                ? { id: s.id, type: 'exchange', amount: 0, managedAccountId: '', notes: '', receiptImage: undefined }
                : { id: s.id, type: 'c2c', amount: 0, otherCustomerId: '', currencyId: '', mainCustomerIsPayer: true, notes: '', receiptImage: undefined };
        }

        const updated = { ...s, ...newSettlementData };
        
        return updated.type === 'exchange'
            ? { id: updated.id, type: 'exchange', amount: updated.amount, managedAccountId: updated.managedAccountId, notes: updated.notes, receiptImage: updated.receiptImage }
            : { id: updated.id, type: 'c2c', amount: updated.amount, otherCustomerId: updated.otherCustomerId, currencyId: updated.currencyId, mainCustomerIsPayer: updated.mainCustomerIsPayer, notes: updated.notes, receiptImage: updated.receiptImage };
    }));
  };
  
  const removeSettlementRow = (id: string) => {
    setSettlements(prev => prev.filter(s => s.id !== id));
  };
  
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const customer = t.customerId ? getCustomerById(t.customerId) : null;
      const sourceCurrency = getCurrencyById(t.sourceCurrencyId);
      const targetCurrency = getCurrencyById(t.targetCurrencyId);
      const userRecorder = getUserById(t.createdByUserId);
      const searchTermLower = searchTerm.toLowerCase();

      const searchMatch = !searchTermLower ||
        (customer && customer.name.toLowerCase().includes(searchTermLower)) ||
        (sourceCurrency && sourceCurrency.name.toLowerCase().includes(searchTermLower)) ||
        (targetCurrency && targetCurrency.name.toLowerCase().includes(searchTermLower)) ||
        (userRecorder && userRecorder.username.toLowerCase().includes(searchTermLower)) ||
        (t.notes && t.notes.toLowerCase().includes(searchTermLower)) ||
        (String(t.transactionNumber).includes(searchTermLower));
        
      if (!searchMatch) return false;
      
      const filterMatch = 
        (!filters.startDate || new Date(t.date) >= getStartOfDay(new Date(filters.startDate))) &&
        (!filters.endDate || new Date(t.date) <= getEndOfDay(new Date(filters.endDate))) &&
        (!filters.customerId || t.customerId === filters.customerId) &&
        (!filters.userId || t.createdByUserId === filters.userId) &&
        (!filters.currencyId || t.sourceCurrencyId === filters.currencyId || t.targetCurrencyId === filters.currencyId) &&
        (!filters.type || (filters.type === 'internal' && !t.customerId) || (filters.type === 'customer' && t.customerId));
      
      return filterMatch;
    });
  }, [transactions, searchTerm, filters, getCustomerById, getCurrencyById, getUserById]);
  
  const sortedTransactions = useMemo(() => {
    let sortableItems = [...filteredTransactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        if (sortConfig.key === 'customerName') {
            aValue = a.customerId ? getCustomerById(a.customerId)?.name : 'انتقال داخلی';
            bValue = b.customerId ? getCustomerById(b.customerId)?.name : 'انتقال داخلی';
        } else {
            aValue = a[sortConfig.key as keyof Transaction];
            bValue = b[sortConfig.key as keyof Transaction];
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredTransactions, sortConfig, getCustomerById]);
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const columns: Column<Transaction>[] = [
    { header: '#', accessor: 'transactionNumber', sortable: true, sortKey: 'transactionNumber' },
    { header: 'تاریخ', accessor: (row: Transaction) => formatShortDate(row.date), sortable: true, sortKey: 'date' },
    { 
      header: 'مشتری/نوع', 
      accessor: (row) => row.customerId ? getCustomerById(row.customerId)?.name : <span className="text-purple-600 dark:text-purple-400">انتقال داخلی</span>,
      sortable: true,
      sortKey: 'customerName'
    },
    { header: 'پرداختی', accessor: (row) => `${formatCurrency(row.sourceAmount, getCurrencyById(row.sourceCurrencyId)?.code)} ${getCurrencyById(row.sourceCurrencyId)?.symbol}` },
    { header: 'دریافتی', accessor: (row) => `${formatCurrency(row.targetAmount, getCurrencyById(row.targetCurrencyId)?.code)} ${getCurrencyById(row.targetCurrencyId)?.symbol}` },
    { header: 'نرخ تبدیل', accessor: (row) => formatNumber(row.exchangeRate) },
    { header: 'یادداشت', accessor: (row) => row.notes || '---', className: 'min-w-[150px]' },
    { header: 'کاربر', accessor: (row) => {
        const creator = getUserById(row.createdByUserId)?.username || '---';
        const verifier = row.verifiedByUserId ? getUserById(row.verifiedByUserId)?.username : null;
        return (
            <div className="text-xs">
                <p>ایجاد: {creator}</p>
                {verifier && <p className="text-green-600 dark:text-green-400" title={`در ${formatDate(row.verifiedAt!)}`}>تایید: {verifier}</p>}
            </div>
        )
    }},
    { header: 'فیش', accessor: (row) => {
        if (!row.receiptImage) return '---';
        return <Button variant="ghost" size="sm" onClick={() => setViewingReceipt(row.receiptImage!)}><PaperClipIcon/></Button>
    }},
    { header: 'عملیات', accessor: (row) => (
        hasPermission('manage_transactions') ? (
            <div className="flex space-x-1 space-x-reverse">
              <Button variant="ghost" size="sm" onClick={() => openModalForEdit(row)}><EditIcon /></Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}><DeleteIcon /></Button>
            </div>
        ) : '---'
      ) 
    },
  ];
  
  const currencyOptions = useMemo(() => currencies.map(c => ({ value: c.id, label: c.name })), [currencies]);
  const customerOptions = useMemo(() => {
    return [...customers]
        .sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.name.localeCompare(b.name);
        })
        .map(c => ({
            value: c.id,
            label: `${c.isFavorite ? '⭐ ' : ''}${c.name}`
        }));
  }, [customers]);
  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.username })), [users]);
  
  const internalAccountOptions = (currencyId?: string) => {
      const filtered = managedAccounts.filter(acc => !currencyId || acc.currencyId === currencyId);
      return filtered.map(acc => ({ value: acc.id, label: `${acc.name} (${getCurrencyById(acc.currencyId)?.code})` }));
  };
  
  if (!hasPermission('view_transactions')) {
      return <AccessDenied />;
  }

  return (
    <div>
      <PageHeader title="تراکنش‌ها">
        {hasPermission('manage_transactions') && (
            <Button onClick={openModalForNew} leftIcon={<PlusIcon className="w-5 h-5"/>}>
              ثبت تراکنش جدید
            </Button>
        )}
      </PageHeader>
      
      <Card>
        <div className="p-4 border-b dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
                <Input placeholder="جستجو در تراکنش‌ها..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} containerClassName="mb-0 flex-grow"/>
                <Button variant="ghost" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} leftIcon={<FilterIcon/>}>
                    {showAdvancedFilters ? 'پنهان کردن فیلترها' : 'فیلترهای پیشرفته'}
                </Button>
            </div>
             {showAdvancedFilters && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                    <JalaliDatePicker label="از تاریخ" value={filters.startDate} onChange={(date) => handleFilterDateChange('startDate', date)} containerClassName="mb-0"/>
                    <JalaliDatePicker label="تا تاریخ" value={filters.endDate} onChange={(date) => handleFilterDateChange('endDate', date)} containerClassName="mb-0"/>
                    <Select label="مشتری" name="customerId" value={filters.customerId} onChange={handleFilterChange} options={customerOptions} placeholder="همه مشتریان" containerClassName="mb-0"/>
                    <Select label="ارز" name="currencyId" value={filters.currencyId} onChange={handleFilterChange} options={currencyOptions} placeholder="همه ارزها" containerClassName="mb-0"/>
                    <Select label="کاربر ثبت کننده" name="userId" value={filters.userId} onChange={handleFilterChange} options={userOptions} placeholder="همه کاربران" containerClassName="mb-0"/>
                    <Select label="نوع تراکنش" name="type" value={filters.type} onChange={handleFilterChange} options={[{value:'customer', label: 'معامله با مشتری'}, {value:'internal', label:'انتقال داخلی'}]} placeholder="همه انواع" containerClassName="mb-0"/>
                    <Button variant="danger" onClick={clearFilters} className="h-10 mt-auto">پاک کردن فیلترها</Button>
                </div>
             )}
        </div>
        <div className="overflow-x-auto">
            <Table<Transaction> 
                columns={columns} 
                data={sortedTransactions} 
                keyExtractor={(row) => row.id} 
                sortConfig={sortConfig}
                requestSort={requestSort}
            />
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? "ویرایش تراکنش" : "ثبت تراکنش جدید"} size="4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            {!editingTransaction && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Select
                        label="نوع تراکنش"
                        value={formMode}
                        onChange={(e) => {
                            const newMode = e.target.value as FormMode;
                            setFormMode(newMode);
                            setFormState(initialTransactionState);
                            setSettlements([]);
                        }}
                        options={[
                            { value: 'customer_trade', label: 'معامله با مشتری' },
                            { value: 'internal', label: 'انتقال داخلی بین حساب‌ها' }
                        ]}
                        containerClassName="mb-0"
                    />
                </div>
            )}

            {formMode === 'internal' ? (
                // --- INTERNAL TRANSFER FORM ---
                <div className="space-y-4 p-2">
                    <Select label="از حساب" name="sourceAccountId" value={formState.sourceAccountId} onChange={handleInputChange} options={internalAccountOptions()} placeholder="انتخاب حساب مبدا" required/>
                    <Select label="به حساب" name="targetAccountId" value={formState.targetAccountId} onChange={handleInputChange} options={internalAccountOptions()} placeholder="انتخاب حساب مقصد" required/>
                    <FormattedNumberInput label="مبلغ انتقال" name="sourceAmount" value={formState.sourceAmount} onValueChange={(name, value) => setFormState(p => ({...p, sourceAmount: value}))} required/>
                    <Input label="نرخ تبدیل (برای تبدیل ارزهای مختلف)" name="exchangeRate" type="number" value={formState.exchangeRate} onChange={handleInputChange} required step="any"/>
                    <Input label="مبلغ دریافتی (محاسبه شده)" value={formatNumber(formState.sourceAmount * formState.exchangeRate, getCurrencyById(getManagedAccountById(formState.targetAccountId)?.currencyId || '')?.code)} disabled/>
                </div>
            ) : (
                // --- CUSTOMER TRADE FORM ---
                <div className="space-y-4">
                    <div className="flex items-end gap-2">
                        <Select label="مشتری" name="customerId" value={formState.customerId} onChange={handleInputChange} options={customerOptions} placeholder="انتخاب مشتری" required containerClassName="flex-grow mb-0"/>
                        <Button type="button" onClick={() => setAddCustomerModalOpen(true)} className="h-10"><PlusIcon /></Button>
                    </div>
                    
                    <Card title="جزئیات معامله">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-3">
                                <h3 className="font-semibold text-red-700 dark:text-red-300">مشتری پرداخت می‌کند</h3>
                                <Select label="ارز پرداختی" name="sourceCurrencyId" value={formState.sourceCurrencyId} onChange={handleInputChange} options={currencyOptions} placeholder="انتخاب ارز" required/>
                                <FormattedNumberInput label="مبلغ پرداختی" name="sourceAmount" value={formState.sourceAmount} onValueChange={(name, value) => handleSmartFormChange('sourceAmount', value)} required/>
                            </div>
                            
                             <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
                                <h3 className="font-semibold text-green-700 dark:text-green-300">مشتری دریافت می‌کند</h3>
                                <Select label="ارز دریافتی" name="targetCurrencyId" value={formState.targetCurrencyId} onChange={handleInputChange} options={currencyOptions} placeholder="انتخاب ارز" required/>
                                <FormattedNumberInput label="مبلغ دریافتی" name="targetAmount" value={formState.targetAmount} onValueChange={(name, value) => handleSmartFormChange('targetAmount', value)} required/>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-end gap-2">
                                <FormattedNumberInput 
                                    label={`نرخ (${customerPaysCurrency?.symbol || 'پرداختی'} به ${customerReceivesCurrency?.symbol || 'دریافتی'})`}
                                    name="exchangeRate"
                                    value={formState.exchangeRate}
                                    onValueChange={(_, val) => handleSmartFormChange('exchangeRate', val)}
                                    required
                                    containerClassName="flex-grow mb-0"
                                />
                            </div>
                            {calculationError && <p className="text-red-600 text-xs mt-1">{calculationError}</p>}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">نرخ معکوس: {formatNumber(1/formState.exchangeRate)}</p>
                        </div>
                    </Card>

                    <Card title="کارمزد / اجرت (تومان)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <FormattedNumberInput label="درصد کارمزد" name="commissionPercentage" value={formState.commissionPercentage} onValueChange={handleFeeChange} />
                                <FormattedNumberInput label="مبلغ کارمزد" name="commissionAmount" value={formState.commissionAmount} onValueChange={handleNumberValueChange} />
                            </div>
                             <div>
                                <FormattedNumberInput label="درصد اجرت" name="wagePercentage" value={formState.wagePercentage} onValueChange={handleFeeChange} />
                                <FormattedNumberInput label="مبلغ اجرت" name="wageAmount" value={formState.wageAmount} onValueChange={handleNumberValueChange} />
                            </div>
                        </div>
                        {customerDiscount > 0 && <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center bg-blue-50 dark:bg-blue-900/30 p-1 rounded">شامل {formatNumber(customerDiscount)}% تخفیف باشگاه مشتریان</p>}
                    </Card>
                </div>
            )}
            
            {/* General Fields */}
            <Input label="یادداشت کلی (اختیاری)" name="notes" value={formState.notes || ''} onChange={handleInputChange} />
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">فیش کلی (اختیاری)</label>
                <div className="mt-1 flex items-center space-x-4 space-x-reverse">
                    <input type="file" id="receipt-upload" className="hidden" accept="image/*" onChange={handleReceiptChange}/>
                    <label htmlFor="receipt-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500">
                        انتخاب فایل
                    </label>
                    {formState.receiptImage && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <img src={formState.receiptImage} alt="پیش‌نمایش فیش" className="h-10 w-10 object-cover rounded"/>
                            <Button type="button" variant="danger" size="sm" onClick={() => setFormState(p => ({...p, receiptImage: undefined}))}>حذف</Button>
                        </div>
                    )}
                </div>
            </div>
            <JalaliDatePicker label="تاریخ تراکنش" value={formState.formDate} onChange={handleFormDateChange} />

            <div className="flex justify-end space-x-2 space-x-reverse pt-3 border-t dark:border-gray-700">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>لغو</Button>
              <Button type="submit" variant="primary">{editingTransaction ? "ذخیره تغییرات" : "ثبت تراکنش"}</Button>
            </div>
        </form>
      </Modal>

      <AddCustomerModal isOpen={isAddCustomerModalOpen} onClose={() => setAddCustomerModalOpen(false)} onSuccess={(newCustomer) => {
          setFormState(prev => ({...prev, customerId: newCustomer.id}));
          setAddCustomerModalOpen(false);
      }} />

      <ImageViewerModal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        imageUrl={viewingReceipt || ''}
        title="مشاهده فیش کلی"
      />
      <ImageViewerModal
        isOpen={!!viewingSettlementReceipt}
        onClose={() => setViewingSettlementReceipt(null)}
        imageUrl={viewingSettlementReceipt || ''}
        title="مشاهده فیش تسویه"
      />
    </div>
  );
};

export default TransactionsPage;