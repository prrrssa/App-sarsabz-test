import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { Customer, CustomerLedgerEntry, CustomerTier, CustomerTierConfig, Transaction } from '../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table, { Column } from '../components/common/Table';
import Card from '../components/common/Card';
import FormattedNumberInput from '../components/common/FormattedNumberInput';
import { PlusIcon, EditIcon, DeleteIcon, EyeIcon, PaperClipIcon, StarSolidIcon, StarOutlineIcon, SaveIcon, CogIcon } from '../constants';
import { formatShortDate, formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import { AccessDenied } from '../App';
import { compressImage } from '../utils/imageUtils';
import ImageViewerModal from '../components/common/ImageViewerModal';

const CustomersPage: React.FC = () => {
  const { 
    customers, addCustomer, updateCustomer, deleteCustomer, toggleCustomerFavorite,
    getCurrencyById, customerLedger, addCustomerLedgerEntry, updateCustomerLedgerEntry, deleteCustomerLedgerEntry,
    addCustomerToCustomerSettlement, currencies, managedAccounts, getManagedAccountById, getUserById, getCustomerById, getCustomerTomanVolume,
    customerTierConfig, updateCustomerTierConfig, transactions
  } = useData();
  const { user, hasPermission } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isEditLedgerModalOpen, setIsEditLedgerModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [selectedCustomerForProfile, setSelectedCustomerForProfile] = useState<Customer | null>(null);
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<CustomerLedgerEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState<'customers' | 'management'>('customers');

  // State for editable tier config
  const [editableTierConfig, setEditableTierConfig] = useState<CustomerTierConfig>(customerTierConfig);
  useEffect(() => { setEditableTierConfig(customerTierConfig) }, [customerTierConfig]);

  const initialLedgerFormState = {
    description: '',
    currencyId: '',
    amount: 0,
    operationType: 'receive',
    managedAccountId: '',
    receiptImage: undefined as (string | undefined),
    payeeCustomerId: '',
  };
  const [ledgerFormState, setLedgerFormState] = useState(initialLedgerFormState);

  useEffect(() => {
    if (editingLedgerEntry) {
      setLedgerFormState({
        description: editingLedgerEntry.description,
        currencyId: editingLedgerEntry.currencyId,
        amount: Math.abs(editingLedgerEntry.amount),
        operationType: editingLedgerEntry.amount > 0 ? 'receive' : 'pay',
        managedAccountId: editingLedgerEntry.managedAccountId || '',
        receiptImage: editingLedgerEntry.receiptImage,
        payeeCustomerId: '',
      });
      setIsEditLedgerModalOpen(true);
    } else {
      setIsEditLedgerModalOpen(false);
    }
  }, [editingLedgerEntry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCurrentCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openModalForNew = () => {
    setIsEditing(false);
    setCurrentCustomer({ name: '', phoneNumber: '', nationalId: '', referrerId: '', referralSource: '', address: '', notes: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer: Customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };
  
  const openProfileModal = (customer: Customer) => {
    setSelectedCustomerForProfile(customer);
    setIsProfileModalOpen(true);
  };

  const openEditLedgerModal = (entry: CustomerLedgerEntry) => {
    setEditingLedgerEntry(entry);
  };
  
  const closeEditLedgerModal = () => {
    setEditingLedgerEntry(null);
    setLedgerFormState(initialLedgerFormState);
  }

  const handleDeleteLedgerEntry = (id: string) => {
    if (!user) return;
    deleteCustomerLedgerEntry(id, user.id);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!currentCustomer.name || !currentCustomer.phoneNumber) {
      alert("نام و شماره تماس مشتری الزامی است.");
      return;
    }
    
    if (isEditing) {
      updateCustomer(currentCustomer as Customer, user.id);
    } else {
      addCustomer(currentCustomer as Omit<Customer, 'id' | 'membershipDate' | 'isFavorite' | 'tier' | 'points'>, user.id);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (customer: Customer) => {
    if (window.confirm(`آیا از حذف مشتری "${customer.name}" مطمئن هستید؟`) && user) {
      deleteCustomer(customer.id, user.id);
      if (selectedCustomerForProfile?.id === customer.id) {
          setIsProfileModalOpen(false);
          setSelectedCustomerForProfile(null);
      }
    }
  };

  const handleLedgerFormChange = (e: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setLedgerFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleLedgerNumberChange = (name: string, value: number) => {
    setLedgerFormState(prev => ({...prev, [name]: value}));
  }

  const handleLedgerFormSubmit = (e: React.FormEvent, isEditMode: boolean) => {
    e.preventDefault();
    if (!user || !selectedCustomerForProfile) return;
    
    if (ledgerFormState.operationType === 'customer_to_customer') {
        if (!ledgerFormState.payeeCustomerId || !ledgerFormState.currencyId || ledgerFormState.amount <= 0 || !ledgerFormState.description) {
            alert("لطفاً مشتری دریافت کننده، ارز، مبلغ و شرح را به درستی وارد کنید."); return;
        }
        const payload = {
            payerId: selectedCustomerForProfile.id,
            payeeId: ledgerFormState.payeeCustomerId,
            currencyId: ledgerFormState.currencyId,
            amount: ledgerFormState.amount,
            description: ledgerFormState.description,
            date: new Date().toISOString(),
            receiptImage: ledgerFormState.receiptImage,
        };
        const success = addCustomerToCustomerSettlement(payload, user.id);
        if (success) {
            setIsLedgerModalOpen(false);
            setLedgerFormState(initialLedgerFormState);
        }
        return;
    }

    if (!ledgerFormState.currencyId || !ledgerFormState.description || !ledgerFormState.managedAccountId || ledgerFormState.amount <= 0) {
        alert("لطفاً تمام فیلدهای لازم را پر کنید."); return;
    }
    
    const finalAmount = ledgerFormState.operationType === 'receive' ? ledgerFormState.amount : -ledgerFormState.amount;
    
    if (isEditMode) {
        if (!editingLedgerEntry) return;
        const updatedEntry: CustomerLedgerEntry = { ...editingLedgerEntry, currencyId: ledgerFormState.currencyId, amount: finalAmount, description: ledgerFormState.description, managedAccountId: ledgerFormState.managedAccountId, receiptImage: ledgerFormState.receiptImage };
        const success = updateCustomerLedgerEntry(updatedEntry, user.id);
        if (success) closeEditLedgerModal();
    } else {
        const ledgerEntry: Omit<CustomerLedgerEntry, 'id' | 'createdByUserId' | 'lastModifiedByUserId' | 'lastModifiedDate'> = { customerId: selectedCustomerForProfile.id, date: new Date().toISOString(), currencyId: ledgerFormState.currencyId, amount: finalAmount, description: ledgerFormState.description, managedAccountId: ledgerFormState.managedAccountId, receiptImage: ledgerFormState.receiptImage, paymentMethod: 'account' };
        const success = addCustomerLedgerEntry(ledgerEntry, user.id);
        if (success) { setIsLedgerModalOpen(false); setLedgerFormState(initialLedgerFormState); }
    }
  };
  
  const handleTierConfigChange = (tier: CustomerTier, field: 'minVolume' | 'commissionDiscount', value: number) => {
      setEditableTierConfig(prev => ({
          ...prev,
          [tier]: { ...prev[tier], [field]: value }
      }));
  };

  const handleSaveTierConfig = () => {
      if(user) {
          updateCustomerTierConfig(editableTierConfig, user.id);
          alert('تنظیمات باشگاه مشتریان با موفقیت ذخیره شد.');
      }
  };


  const filteredCustomers = useMemo(() => customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.includes(searchTerm) ||
    (c.nationalId && c.nationalId.includes(searchTerm))
  ).sort((a,b) => (a.isFavorite === b.isFavorite) ? a.name.localeCompare(b.name) : a.isFavorite ? -1 : 1), [customers, searchTerm]);
  
  const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);

  const currencyOptions = currencies.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }));

  const accountOptionsForLedger = useMemo(() => {
      if (!ledgerFormState.currencyId) return [];
      return managedAccounts.filter(acc => acc.currencyId === ledgerFormState.currencyId).map(acc => ({ value: acc.id, label: acc.name }));
  }, [ledgerFormState.currencyId, managedAccounts]);

  if (!hasPermission('view_customers')) {
      return <AccessDenied />;
  }

  const renderManagementCard = () => (
    <Card title={<div className="flex items-center gap-2"><CogIcon /> مدیریت باشگاه مشتریان</div>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(editableTierConfig) as CustomerTier[]).filter(t => t !== CustomerTier.BRONZE).map(tierKey => {
                const tier = editableTierConfig[tierKey];
                const membersCount = customers.filter(c => c.tier === tierKey).length;
                return (
                    <div key={tierKey} className="p-4 border rounded-lg dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <tier.icon className={`w-6 h-6 ${tier.color}`} />
                            <h3 className={`text-lg font-bold ${tier.color}`}>{tier.label}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({membersCount} عضو)</span>
                        </div>
                        <FormattedNumberInput
                            label="حداقل حجم معامله (تومان)"
                            name="minVolume"
                            value={tier.minVolume}
                            onValueChange={(_, val) => handleTierConfigChange(tierKey, 'minVolume', val)}
                        />
                        <FormattedNumberInput
                            label="تخفیف کارمزد (%)"
                            name="commissionDiscount"
                            value={tier.commissionDiscount}
                            onValueChange={(_, val) => handleTierConfigChange(tierKey, 'commissionDiscount', val)}
                        />
                    </div>
                )
            })}
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveTierConfig} leftIcon={<SaveIcon />}>ذخیره تنظیمات</Button>
        </div>
    </Card>
  );
  
  const renderProfileSection = (customer: Customer) => {
    const { tier } = customer;
    const tierConfig = customerTierConfig[tier];
    const customerVolume = getCustomerTomanVolume(customer.id);
    const sortedTiers = Object.values(customerTierConfig).sort((a,b) => a.minVolume - b.minVolume);
    const currentTierIndex = sortedTiers.findIndex(t => t.label === tierConfig.label);
    const nextTier = currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;
    const progressPercentage = nextTier ? Math.min((customerVolume / nextTier.minVolume) * 100, 100) : 100;

    return (
        <div className="space-y-6">
            <Card title="خلاصه وضعیت" actions={
                 <div className="flex space-x-1 space-x-reverse">
                    {hasPermission('manage_customers') && ( <>
                        <Button variant="ghost" size="sm" onClick={() => openModalForEdit(customer)} title="ویرایش"><EditIcon /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(customer)} title="حذف"><DeleteIcon /></Button>
                    </>)}
                </div>
            }>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong>شماره تماس:</strong> {customer.phoneNumber}</p>
                    <p><strong>کد ملی:</strong> {customer.nationalId || '---'}</p>
                    <p><strong>تاریخ عضویت:</strong> {formatDate(customer.membershipDate)}</p>
                    <p><strong>معرف:</strong> {customer.referrerId ? getCustomerById(customer.referrerId)?.name : '---'}</p>
                    <p><strong>منبع معرفی:</strong> {customer.referralSource || '---'}</p>
                    <p className="md:col-span-2"><strong>آدرس:</strong> {customer.address || '---'}</p>
                    <p className="md:col-span-2"><strong>یادداشت:</strong> {customer.notes || '---'}</p>
                </div>
            </Card>

            <Card title="وضعیت باشگاه مشتریان">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg w-full md:w-48">
                        <tierConfig.icon className={`w-16 h-16 ${tierConfig.color}`} />
                        <span className={`mt-2 text-2xl font-bold ${tierConfig.color}`}>{tierConfig.label}</span>
                    </div>
                    <div className="flex-grow space-y-4 w-full">
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200">مزایای سطح فعلی</h4>
                            <p className="text-green-600 dark:text-green-400 font-semibold">{formatNumber(tierConfig.commissionDiscount)}% تخفیف در کارمزد و اجرت</p>
                        </div>
                        {nextTier && (
                             <div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">پیشرفت به سطح {nextTier.label}</h4>
                                    <p className="text-xs font-mono">{formatNumber(progressPercentage, 'en-US', {maximumFractionDigits: 1})}%</p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div className="bg-gradient-to-r from-primary-400 to-accent-400 h-2.5 rounded-full" style={{width: `${progressPercentage}%`}}></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                                    حجم معاملات: {formatCurrency(customerVolume)} / {formatCurrency(nextTier.minVolume)} تومان
                                </p>
                             </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
  };
  
  const renderLedgerSection = (customer: Customer) => {
    const customerLedgerForView = customerLedger.filter(l => l.customerId === customer.id);
    const ledgerColumns: Column<CustomerLedgerEntry>[] = [
      { header: 'تاریخ', accessor: (row) => formatDate(row.date) },
      { header: 'شرح', accessor: 'description' },
      { header: 'بدهکار', accessor: (row) => row.amount < 0 ? <span className="text-red-600 dark:text-red-400">{formatCurrency(Math.abs(row.amount), getCurrencyById(row.currencyId)?.code)}</span> : '---' },
      { header: 'بستانکار', accessor: (row) => row.amount > 0 ? <span className="text-green-600 dark:text-green-400">{formatCurrency(row.amount, getCurrencyById(row.currencyId)?.code)}</span> : '---' },
      { header: 'ارز', accessor: (row) => getCurrencyById(row.currencyId)?.code || 'N/A' },
      { header: 'عملیات', accessor: (row) => !row.transactionId && hasPermission('manage_customer_ledger') ? (
          <div className="flex items-center space-x-1 space-x-reverse justify-center">
              <Button variant="ghost" size="sm" onClick={() => openEditLedgerModal(row)} title="ویرایش"><EditIcon /></Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteLedgerEntry(row.id)} title="حذف"><DeleteIcon /></Button>
          </div>
      ) : <span className="text-xs text-gray-400">سیستمی</span> }
    ];

    return (
        <Card title="دفتر حساب" actions={hasPermission('manage_customer_ledger') && <Button onClick={() => setIsLedgerModalOpen(true)} leftIcon={<PlusIcon />}>ثبت ردیف جدید</Button>}>
            <Table<CustomerLedgerEntry> columns={ledgerColumns} data={customerLedgerForView} keyExtractor={(row) => row.id} />
        </Card>
    );
  };

  const renderTransactionsSection = (customer: Customer) => {
    const customerTransactions = transactions.filter(t => t.customerId === customer.id);
    const transactionColumns: Column<Transaction>[] = [
        { header: '#', accessor: 'transactionNumber' },
        { header: 'تاریخ', accessor: (row) => formatShortDate(row.date)},
        { header: 'پرداختی', accessor: (row) => `${formatCurrency(row.sourceAmount, getCurrencyById(row.sourceCurrencyId)?.code)} ${getCurrencyById(row.sourceCurrencyId)?.symbol}` },
        { header: 'دریافتی', accessor: (row) => `${formatCurrency(row.targetAmount, getCurrencyById(row.targetCurrencyId)?.code)} ${getCurrencyById(row.targetCurrencyId)?.symbol}` },
        { header: 'نرخ', accessor: (row) => formatNumber(row.exchangeRate) },
        { header: 'یادداشت', accessor: 'notes'},
    ];
    return (
        <Card title="تاریخچه تراکنش‌ها">
            <Table<Transaction> columns={transactionColumns} data={customerTransactions} keyExtractor={(row) => row.id} />
        </Card>
    );
  };


  return (
    <div>
      <PageHeader title="مشتریان">
        {hasPermission('manage_customers') && activeTab === 'customers' && (
            <Button onClick={openModalForNew} leftIcon={<PlusIcon className="w-5 h-5"/>}>
              افزودن مشتری جدید
            </Button>
        )}
      </PageHeader>
      
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
            <button onClick={() => setActiveTab('customers')} className={`${activeTab === 'customers' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                لیست مشتریان
            </button>
            {hasPermission('manage_users') && (
                <button onClick={() => setActiveTab('management')} className={`${activeTab === 'management' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    مدیریت باشگاه
                </button>
            )}
        </nav>
      </div>

      <div>
        {activeTab === 'customers' && (
            <>
                <Input placeholder="جستجو در مشتریان (نام، شماره تماس، کد ملی...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCustomers.length > 0 ? filteredCustomers.map(customer => {
                        const tierInfo = customerTierConfig[customer.tier];
                        const customerVolume = getCustomerTomanVolume(customer.id);
                        return (
                            <Card key={customer.id} className="flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-200" bodyClassName="flex flex-col flex-grow">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 mb-2">
                                            <tierInfo.icon className={`w-8 h-8 ${tierInfo.color}`} />
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{customer.name}</h3>
                                        </div>
                                        <button onClick={() => user && toggleCustomerFavorite(customer.id, user.id)} className="p-1">
                                            {customer.isFavorite ? <StarSolidIcon className="w-5 h-5 text-yellow-500" /> : <StarOutlineIcon className="w-5 h-5 text-gray-400 hover:text-yellow-500"/>}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phoneNumber}</p>
                                    <div className="mt-4 text-xs bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                        <div className="flex justify-between"><span>سطح:</span> <span className={`font-semibold ${tierInfo.color}`}>{tierInfo.label}</span></div>
                                        <div className="flex justify-between"><span>حجم معاملات:</span> <span className="font-semibold">{formatCurrency(customerVolume)}</span></div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t dark:border-gray-600">
                                    <Button onClick={() => openProfileModal(customer)} variant="secondary" className="w-full">مشاهده پروفایل</Button>
                                </div>
                            </Card>
                        )
                    }) : <p className="text-center text-gray-500 dark:text-gray-400 py-8 md:col-span-2 lg:col-span-3 xl:col-span-4">مشتری یافت نشد.</p>}
                </div>
            </>
        )}
        {activeTab === 'management' && hasPermission('manage_users') && renderManagementCard()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "ویرایش مشتری" : "افزودن مشتری جدید"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="نام مشتری" name="name" value={currentCustomer.name || ''} onChange={handleInputChange} required />
          <Input label="شماره تماس" name="phoneNumber" type="tel" value={currentCustomer.phoneNumber || ''} onChange={handleInputChange} required />
          <Input label="کد ملی (اختیاری)" name="nationalId" value={currentCustomer.nationalId || ''} onChange={handleInputChange} />
          <Select label="معرف (اختیاری)" name="referrerId" value={currentCustomer.referrerId || ''} onChange={handleInputChange} options={[{ value: '', label: '---' }, ...customerOptions.filter(opt => opt.value !== currentCustomer.id)]} />
          <Input label="منبع معرفی (اختیاری)" name="referralSource" placeholder="مثال: اینستاگرام، دوست، وبسایت" value={currentCustomer.referralSource || ''} onChange={handleInputChange} />
          <textarea name="address" rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="آدرس" value={currentCustomer.address || ''} onChange={handleInputChange}></textarea>
          <textarea name="notes" rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="یادداشت" value={currentCustomer.notes || ''} onChange={handleInputChange}></textarea>
          <div className="flex justify-end space-x-2 space-x-reverse pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>لغو</Button>
            <Button type="submit" variant="primary">{isEditing ? "ذخیره" : "افزودن"}</Button>
          </div>
        </form>
      </Modal>

      {selectedCustomerForProfile && (
        <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title={`پروفایل: ${selectedCustomerForProfile.name}`} size="5xl">
            <div className="pt-2 space-y-8">
                {renderProfileSection(selectedCustomerForProfile)}
                {renderLedgerSection(selectedCustomerForProfile)}
                {renderTransactionsSection(selectedCustomerForProfile)}
            </div>
        </Modal>
      )}

      {selectedCustomerForProfile && (
        <Modal isOpen={isLedgerModalOpen} onClose={() => setIsLedgerModalOpen(false)} title={`ثبت ردیف جدید برای ${selectedCustomerForProfile.name}`}>
            <form onSubmit={(e) => handleLedgerFormSubmit(e, false)} className="space-y-4">
                <Select label="نوع عملیات" name="operationType" value={ledgerFormState.operationType} onChange={handleLedgerFormChange} options={[{value: 'receive', label: 'دریافت از مشتری'}, {value: 'pay', label: 'پرداخت به مشتری'}, {value: 'customer_to_customer', label: 'پرداخت به مشتری دیگر'}]} required />
                {ledgerFormState.operationType === 'customer_to_customer' && <Select label="پرداخت به" name="payeeCustomerId" value={ledgerFormState.payeeCustomerId} onChange={handleLedgerFormChange} options={customerOptions.filter(o => o.value !== selectedCustomerForProfile.id)} placeholder="انتخاب مشتری" required />}
                <Select label="ارز" name="currencyId" value={ledgerFormState.currencyId} onChange={handleLedgerFormChange} options={currencyOptions} placeholder="انتخاب ارز" required />
                <FormattedNumberInput label="مبلغ" name="amount" value={ledgerFormState.amount} onValueChange={handleLedgerNumberChange} required />
                {ledgerFormState.operationType !== 'customer_to_customer' && <Select label="حساب صرافی" name="managedAccountId" value={ledgerFormState.managedAccountId} onChange={handleLedgerFormChange} options={accountOptionsForLedger} placeholder="انتخاب حساب" disabled={!ledgerFormState.currencyId} required />}
                <Input label="شرح" name="description" value={ledgerFormState.description} onChange={handleLedgerFormChange} required />
                <div className="flex justify-end pt-3"><Button type="submit">ثبت</Button></div>
            </form>
        </Modal>
      )}

      {editingLedgerEntry && selectedCustomerForProfile && (
           <Modal isOpen={isEditLedgerModalOpen} onClose={closeEditLedgerModal} title={`ویرایش ردیف برای ${selectedCustomerForProfile.name}`}>
              <form onSubmit={(e) => handleLedgerFormSubmit(e, true)} className="space-y-4">
                  {/* Form fields for editing... */}
                  <div className="flex justify-end pt-3"><Button type="submit">ذخیره</Button></div>
              </form>
           </Modal>
      )}

    </div>
  );
};

export default CustomersPage;