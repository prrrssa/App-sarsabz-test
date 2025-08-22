


import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Currency, User, UserRole, Permission, ManagedAccount, AccountAdjustment } from '../types';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import FormattedNumberInput from '../components/common/FormattedNumberInput';
import Table, { Column } from '../components/common/Table';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { PlusIcon, EditIcon, DeleteIcon, TOMAN_CURRENCY_CODE, CalculatorIcon } from '../constants';
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '../constants';
import { formatCurrency, formatDate } from '../utils/formatters';

// --- State Types ---
interface CurrencyFormState extends Partial<Currency> {}
interface AccountFormState extends Partial<ManagedAccount> {
    initialBalance?: number;
}
interface UserFormState extends Partial<User> {
    passwordConfirm?: string;
}

const AccessDenied: React.FC = () => (
    <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">دسترسی غیر مجاز</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">شما اجازه مشاهده یا تغییر این بخش را ندارید.</p>
    </div>
);


const SettingsPage: React.FC = () => {
  const { 
      currencies, addCurrency, updateCurrency, deleteCurrency, 
      users, addUser, updateUser, deleteUser,
      managedAccounts, addManagedAccount, updateManagedAccount, deleteManagedAccount, adjustAccountBalance, accountAdjustments,
      clearAllApplicationData,
      getCurrencyById, getUserById, getManagedAccountById
  } = useData();
  const { user, hasPermission } = useAuth();
  
  // --- Currency State ---
  const [isCurrencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyFormState>({});
  const [isEditingCurrency, setIsEditingCurrency] = useState(false);
  
  // --- Account State ---
  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<AccountFormState>({});
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  
  // --- Adjust Balance State ---
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [accountToAdjust, setAccountToAdjust] = useState<ManagedAccount | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({ adjustmentAmount: 0, reason: '' });

  // --- User State ---
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserFormState>({});
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  const canManageSettings = hasPermission('manage_users') || hasPermission('manage_currencies') || hasPermission('reset_application_data') || hasPermission('manage_internal_accounts');

  if (!canManageSettings) {
      return <AccessDenied />;
  }

  // --- Currency Handlers ---
  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentCurrency(prev => ({ ...prev, [name]: name === 'type' ? value : value }));
  };
  const openCurrencyModalForNew = () => {
    setIsEditingCurrency(false);
    setCurrentCurrency({ code: '', name: '', symbol: '', type: 'fiat' });
    setCurrencyModalOpen(true);
  };
  const openCurrencyModalForEdit = (currency: Currency) => {
    setIsEditingCurrency(true);
    setCurrentCurrency(currency);
    setCurrencyModalOpen(true);
  };
  const handleCurrencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!currentCurrency.code || !currentCurrency.name || !currentCurrency.symbol) {
      alert("کد، نام و نماد ارز الزامی است.");
      return;
    }
    const payload = { 
        code: currentCurrency.code, 
        name: currentCurrency.name, 
        symbol: currentCurrency.symbol,
        type: currentCurrency.type || 'fiat'
    };
    if (isEditingCurrency) {
      if (!currentCurrency.id) return;
      updateCurrency({ id: currentCurrency.id, ...payload }, user.id);
    } else {
      addCurrency(payload, user.id);
    }
    setCurrencyModalOpen(false);
  };
  const handleCurrencyDelete = (currencyId: string) => {
    if (window.confirm("آیا از حذف این ارز مطمئن هستید؟ این عمل تنها در صورتی موفق خواهد بود که موجودی کل آن صفر باشد.") && user) {
      deleteCurrency(currencyId, user.id);
    }
  };

  // --- Account Handlers ---
  const handleAccountInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setCurrentAccount(prev => ({ ...prev, [name]: val }));
  };
  const handleAccountNumberChange = (name: string, value: number) => {
    setCurrentAccount(prev => ({ ...prev, [name]: value }));
  };
  const openAccountModalForNew = () => {
    setIsEditingAccount(false);
    setCurrentAccount({ name: '', currencyId: '', accountNumber: '', description: '', isCashAccount: false, initialBalance: 0 });
    setAccountModalOpen(true);
  };
  const openAccountModalForEdit = (account: ManagedAccount) => {
    setIsEditingAccount(true);
    setCurrentAccount(account);
    setAccountModalOpen(true);
  };
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!currentAccount.name || !currentAccount.currencyId) {
      alert("نام حساب و ارز الزامی است.");
      return;
    }
    
    if (isEditingAccount) {
      if (!currentAccount.id) return;
      const { initialBalance, ...payload } = currentAccount;
      updateManagedAccount({ ...payload, isCashAccount: !!payload.isCashAccount } as ManagedAccount, user.id);
    } else {
      const payload: Omit<ManagedAccount, 'id'> = {
          name: currentAccount.name!,
          currencyId: currentAccount.currencyId!,
          balance: currentAccount.initialBalance || 0,
          accountNumber: currentAccount.accountNumber,
          description: currentAccount.description,
          isCashAccount: !!currentAccount.isCashAccount,
      };
      addManagedAccount(payload, user.id);
    }
    setAccountModalOpen(false);
  };
  const handleAccountDelete = (accountId: string) => {
    if (window.confirm("آیا از حذف این حساب مطمئن هستید؟") && user) {
      deleteManagedAccount(accountId, user.id);
    }
  };

  // --- Adjust Balance Handlers ---
  const openAdjustBalanceModal = (account: ManagedAccount) => {
    setAccountToAdjust(account);
    setAdjustmentForm({ adjustmentAmount: 0, reason: '' });
    setIsAdjustModalOpen(true);
  };
  
  const handleAdjustmentFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdjustmentForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleAdjustmentNumberChange = (name: string, value: number) => {
    setAdjustmentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountToAdjust || !adjustmentForm.reason) {
      alert("لطفا علت اصلاح موجودی را وارد کنید.");
      return;
    }
    const success = adjustAccountBalance({
      accountId: accountToAdjust.id,
      adjustmentAmount: adjustmentForm.adjustmentAmount,
      reason: adjustmentForm.reason
    }, user.id);
    if(success) {
        setIsAdjustModalOpen(false);
    }
  };

  // --- User Handlers ---
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCurrentUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
      setCurrentUser(prev => {
          const currentPermissions = prev.permissions || [];
          if (isChecked) {
              return { ...prev, permissions: [...currentPermissions, permission] };
          } else {
              return { ...prev, permissions: currentPermissions.filter(p => p !== permission) };
          }
      });
  };
  const openUserModalForNew = () => {
      setIsEditingUser(false);
      setCurrentUser({ username: '', password: '', role: UserRole.ACCOUNTANT, permissions: [], passwordConfirm: '' });
      setUserModalOpen(true);
  };
  const openUserModalForEdit = (userToEdit: User) => {
      setIsEditingUser(true);
      setCurrentUser({ ...userToEdit, password: '', passwordConfirm: '' });
      setUserModalOpen(true);
  };
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { username, password, role, id, permissions, passwordConfirm } = currentUser;
    if (!username || !role) {
      alert("نام کاربری و نقش الزامی است."); return;
    }
    if (password !== passwordConfirm) {
      alert("رمزهای عبور مطابقت ندارند."); return;
    }
    if (!isEditingUser && !password) {
      alert("برای کاربر جدید، رمز عبور الزامی است."); return;
    }

    let success = false;
    if (isEditingUser) {
        if (!id) return;
        const originalUser = users.find(u => u.id === id);
        if (!originalUser) return;
        const payload: User = { ...originalUser, role, permissions: permissions || [] };
        if (password) payload.password = password; // Only update password if a new one is provided
        success = updateUser(payload, user.id);
    } else {
        success = addUser({ username, password: password!, role, permissions: permissions || [] }, user.id);
    }

    if (success) {
      setUserModalOpen(false);
    }
  };
  const handleUserDelete = (userId: string) => {
      if(window.confirm("آیا از حذف این کاربر مطمئن هستید؟") && user) {
          deleteUser(userId, user.id);
      }
  };


  // --- General Handlers ---
  const handleClearAllData = () => {
    if (user && window.confirm("هشدار: آیا مطمئن هستید که می‌خواهید تمام داده‌های برنامه را پاک کنید؟ این عمل غیرقابل بازگشت است.")) {
      if (window.confirm("تایید نهایی: این آخرین فرصت برای انصراف است. آیا ادامه می‌دهید؟")) {
        clearAllApplicationData(user.id);
      }
    }
  };

  // --- Table Columns & Options ---
  const currencyColumns: Column<Currency>[] = [
    { header: 'کد ارز', accessor: 'code' },
    { header: 'نام ارز', accessor: 'name' },
    { header: 'نماد', accessor: 'symbol' },
    { header: 'نوع', accessor: (row) => row.type === 'commodity' ? 'کالا' : 'ارز' },
    { header: 'عملیات', accessor: (row: Currency) => (
        <div className="flex space-x-1 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={() => openCurrencyModalForEdit(row)} title="ویرایش"><EditIcon /></Button>
          {row.code !== TOMAN_CURRENCY_CODE && <Button variant="danger" size="sm" onClick={() => handleCurrencyDelete(row.id)} title="حذف"><DeleteIcon /></Button>}
        </div>
      )
    },
  ];

  const accountColumns: Column<ManagedAccount>[] = [
    { header: 'نام حساب', accessor: 'name' },
    { header: 'ارز', accessor: (row) => currencies.find(c => c.id === row.currencyId)?.code || 'N/A' },
    { header: 'موجودی', accessor: (row) => formatCurrency(row.balance, currencies.find(c => c.id === row.currencyId)?.code) },
    { header: 'شماره حساب', accessor: (row) => row.accountNumber || '---' },
    { header: 'توضیحات', accessor: (row) => row.description || '---', className: 'min-w-[200px]' },
    { header: 'عملیات', accessor: (row: ManagedAccount) => (
        <div className="flex space-x-1 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={() => openAdjustBalanceModal(row)} title="اصلاح موجودی"><CalculatorIcon /></Button>
          <Button variant="ghost" size="sm" onClick={() => openAccountModalForEdit(row)} title="ویرایش"><EditIcon /></Button>
          <Button variant="danger" size="sm" onClick={() => handleAccountDelete(row.id)} title="حذف"><DeleteIcon /></Button>
        </div>
      )
    },
  ];

  const userColumns: Column<User>[] = [
      { header: 'نام کاربری', accessor: 'username' },
      { header: 'نقش', accessor: (row) => row.role === UserRole.ADMIN ? 'ادمین' : 'حسابدار' },
      { header: 'دسترسی‌ها', accessor: (row) => row.permissions.length },
      { header: 'عملیات', accessor: (row: User) => (
          <div className="flex space-x-1 space-x-reverse">
              <Button variant="ghost" size="sm" onClick={() => openUserModalForEdit(row)} title="ویرایش کاربر" disabled={row.role === UserRole.ADMIN}><EditIcon /></Button>
              <Button variant="danger" size="sm" onClick={() => handleUserDelete(row.id)} title="حذف کاربر" disabled={row.role === UserRole.ADMIN}><DeleteIcon /></Button>
          </div>
      )},
  ];

  const adjustmentColumns: Column<AccountAdjustment>[] = [
    { header: 'تاریخ', accessor: (row) => formatDate(row.timestamp), className: 'text-xs whitespace-nowrap' },
    { header: 'حساب', accessor: (row) => getManagedAccountById(row.accountId)?.name || 'نامشخص' },
    { header: 'کاربر', accessor: (row) => getUserById(row.userId)?.username || 'نامشخص' },
    { header: 'علت', accessor: 'reason', className: 'min-w-[200px]' },
    { header: 'مبلغ اصلاح', accessor: (row) => {
        const currencyCode = getManagedAccountById(row.accountId)?.currencyId;
        const currency = getCurrencyById(currencyCode || '');
        const isPositive = row.adjustmentAmount >= 0;
        return <span className={isPositive ? 'text-green-600' : 'text-red-600'}>{formatCurrency(row.adjustmentAmount, currency?.code)}</span>;
    }},
    { header: 'موجودی قبلی', accessor: (row) => formatCurrency(row.previousBalance, getCurrencyById(getManagedAccountById(row.accountId)?.currencyId || '')?.code)},
    { header: 'موجودی جدید', accessor: (row) => <span className="font-bold">{formatCurrency(row.newBalance, getCurrencyById(getManagedAccountById(row.accountId)?.currencyId || '')?.code)}</span> },
  ];

  const currencyOptions = useMemo(() => currencies.map(c => ({ value: c.id, label: `${c.name} (${c.code})` })), [currencies]);

  const newBalanceAfterAdjustment = accountToAdjust ? accountToAdjust.balance + adjustmentForm.adjustmentAmount : 0;

  return (
    <div>
      <PageHeader title="تنظیمات سیستم" />
      
      <div className="space-y-8">
        {hasPermission('manage_currencies') && (
            <Card title="مدیریت ارزها" actions={
                <Button onClick={openCurrencyModalForNew} leftIcon={<PlusIcon className="w-5 h-5"/>} variant="secondary">
                  افزودن ارز جدید
                </Button>
            }>
              <div className="overflow-x-auto">
                  <Table<Currency> columns={currencyColumns} data={currencies} keyExtractor={(row) => row.id} />
              </div>
            </Card>
        )}

        {hasPermission('manage_internal_accounts') && (
            <Card title="مدیریت حساب‌های داخلی" actions={
                <Button onClick={openAccountModalForNew} leftIcon={<PlusIcon className="w-5 h-5"/>} variant="secondary">
                  افزودن حساب جدید
                </Button>
            }>
              <div className="overflow-x-auto">
                  <Table<ManagedAccount> columns={accountColumns} data={managedAccounts} keyExtractor={(row) => row.id} />
              </div>
            </Card>
        )}

        {hasPermission('manage_internal_accounts') && accountAdjustments.length > 0 && (
            <Card title="تاریخچه اصلاح موجودی حساب‌ها">
                <div className="overflow-x-auto">
                    <Table<AccountAdjustment> columns={adjustmentColumns} data={accountAdjustments} keyExtractor={(row) => row.id} />
                </div>
            </Card>
        )}

        {hasPermission('manage_users') && (
            <Card title="مدیریت کاربران" actions={
                <Button onClick={openUserModalForNew} leftIcon={<PlusIcon />} variant="secondary">
                    افزودن کاربر جدید
                </Button>
            }>
                <div className="overflow-x-auto">
                    <Table<User> columns={userColumns} data={users} keyExtractor={row => row.id} />
                </div>
            </Card>
        )}

        {hasPermission('reset_application_data') && (
            <Card title="عملیات حساس" className="border-red-500/50 dark:border-red-500/80 border-2 bg-red-50/20 dark:bg-red-900/20" titleClassName="text-red-700 dark:text-red-400">
              <div className="p-4">
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  هشدار: عملیات زیر داده‌های برنامه را به طور دائمی پاک می‌کنند. لطفاً با احتیاط کامل اقدام کنید.
                </p>
                <Button variant="danger" onClick={handleClearAllData}>
                  پاک کردن تمام داده‌های برنامه
                </Button>
              </div>
            </Card>
        )}
      </div>

      {/* --- Modals --- */}
      <Modal isOpen={isCurrencyModalOpen} onClose={() => setCurrencyModalOpen(false)} title={isEditingCurrency ? "ویرایش ارز" : "افزودن ارز جدید"}>
        <form onSubmit={handleCurrencySubmit} className="space-y-4">
          <Input label="کد ارز (مثال: USD)" name="code" value={currentCurrency.code || ''} onChange={handleCurrencyInputChange} required maxLength={10} disabled={isEditingCurrency && currentCurrency.code?.toUpperCase() === TOMAN_CURRENCY_CODE}/>
          <Input label="نام ارز (مثال: دلار آمریکا)" name="name" value={currentCurrency.name || ''} onChange={handleCurrencyInputChange} required />
          <Input label="نماد ارز (مثال: $)" name="symbol" value={currentCurrency.symbol || ''} onChange={handleCurrencyInputChange} required />
          <Select label="نوع" name="type" value={currentCurrency.type || 'fiat'} onChange={handleCurrencyInputChange} options={[{value: 'fiat', label:'ارز فیات'}, {value: 'commodity', label: 'کالا'}]}/>
          <div className="flex justify-end space-x-2 space-x-reverse pt-3">
            <Button type="button" variant="ghost" onClick={() => setCurrencyModalOpen(false)}>لغو</Button>
            <Button type="submit" variant="primary">{isEditingCurrency ? "ذخیره تغییرات" : "افزودن ارز"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAccountModalOpen} onClose={() => setAccountModalOpen(false)} title={isEditingAccount ? "ویرایش حساب داخلی" : "افزودن حساب داخلی"}>
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <Input label="نام حساب (مثال: بانک ملی یا صندوق نقدی)" name="name" value={currentAccount.name || ''} onChange={handleAccountInputChange} required />
          <Select label="ارز" name="currencyId" value={currentAccount.currencyId || ''} onChange={handleAccountInputChange} options={currencyOptions} placeholder="انتخاب ارز" required disabled={isEditingAccount}/>
          <Input label="شماره حساب (اختیاری)" name="accountNumber" value={currentAccount.accountNumber || ''} onChange={handleAccountInputChange} />
          <div>
            <label htmlFor="account_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات (اختیاری)</label>
            <textarea id="account_description" name="description" rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom-gold focus:border-custom-gold sm:text-sm" value={currentAccount.description || ''} onChange={handleAccountInputChange}></textarea>
          </div>
          <div className="flex items-center">
            <input
              id="isCashAccount" name="isCashAccount" type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
              checked={!!currentAccount.isCashAccount} onChange={handleAccountInputChange}/>
            <label htmlFor="isCashAccount" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">این یک صندوق نقدی است</label>
          </div>
          {isEditingAccount ? (
            <Input label="موجودی" value={formatCurrency(currentAccount.balance, getCurrencyById(currentAccount.currencyId!)?.code)} disabled />
          ) : (
            <FormattedNumberInput label="موجودی اولیه (اختیاری)" name="initialBalance" value={currentAccount.initialBalance} onValueChange={handleAccountNumberChange} />
          )}
          <div className="flex justify-end space-x-2 space-x-reverse pt-3">
            <Button type="button" variant="ghost" onClick={() => setAccountModalOpen(false)}>لغو</Button>
            <Button type="submit" variant="primary">{isEditingAccount ? "ذخیره تغییرات" : "افزودن حساب"}</Button>
          </div>
        </form>
      </Modal>
      
      {accountToAdjust && (
        <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title={`اصلاح موجودی: ${accountToAdjust.name}`}>
          <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
             <Input label="موجودی فعلی" value={formatCurrency(accountToAdjust.balance, getCurrencyById(accountToAdjust.currencyId)?.code)} disabled />
             <FormattedNumberInput label="مبلغ اصلاح (+/-)" name="adjustmentAmount" value={adjustmentForm.adjustmentAmount} onValueChange={handleAdjustmentNumberChange} required />
             <Input label="علت اصلاح" name="reason" value={adjustmentForm.reason} onChange={handleAdjustmentFormChange} placeholder="مثال: مغایرت صندوق گردانی" required />
             <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">موجودی جدید پس از اصلاح</p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-300">
                    {formatCurrency(newBalanceAfterAdjustment, getCurrencyById(accountToAdjust.currencyId)?.code)}
                </p>
             </div>
             <div className="flex justify-end space-x-2 space-x-reverse pt-3">
                <Button type="button" variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>لغو</Button>
                <Button type="submit" variant="primary">ثبت اصلاحیه</Button>
             </div>
          </form>
        </Modal>
      )}

      <Modal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} title={isEditingUser ? 'ویرایش کاربر' : 'افزودن کاربر جدید'} size="lg">
          <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="نام کاربری" name="username" value={currentUser.username || ''} onChange={handleUserInputChange} required disabled={isEditingUser} />
                 <Select label="نقش کلی" name="role" value={currentUser.role || ''} onChange={handleUserInputChange} options={[{value: UserRole.ACCOUNTANT, label: 'حسابدار'}]} required disabled={true}/>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={isEditingUser ? "رمز عبور جدید (اختیاری)" : "رمز عبور"} name="password" type="password" value={currentUser.password || ''} onChange={handleUserInputChange} placeholder={isEditingUser ? 'برای عدم تغییر، خالی بگذارید' : ''} />
                <Input label="تکرار رمز عبور" name="passwordConfirm" type="password" value={currentUser.passwordConfirm || ''} onChange={handleUserInputChange} />
              </div>

              <Card title="دسترسی‌ها">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-60 overflow-y-auto p-2">
                      {ALL_PERMISSIONS.map(permission => (
                           <label key={permission} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                              <input 
                                  type="checkbox"
                                  className="rounded text-accent-500 focus:ring-accent-400"
                                  checked={(currentUser.permissions || []).includes(permission)}
                                  onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{PERMISSION_LABELS[permission]}</span>
                           </label>
                      ))}
                  </div>
              </Card>

              <div className="flex justify-end space-x-2 space-x-reverse pt-3">
                  <Button type="button" variant="ghost" onClick={() => setUserModalOpen(false)}>لغو</Button>
                  <Button type="submit" variant="primary">{isEditingUser ? 'ذخیره تغییرات' : 'افزودن کاربر'}</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
