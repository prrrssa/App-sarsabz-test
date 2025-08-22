

import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { PersonalExpense, Task, TaskStatus, UserRole } from '../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table, { Column } from '../components/common/Table';
import Card from '../components/common/Card';
import FormattedNumberInput from '../components/common/FormattedNumberInput';
import JalaliDatePicker from '../components/common/JalaliDatePicker';
import { PlusIcon, EditIcon, DeleteIcon } from '../constants';
import { formatShortDate, formatCurrency, formatDate } from '../utils/formatters';
import { PERSONAL_EXPENSE_CATEGORIES, TOMAN_CURRENCY_CODE } from '../constants';
import { toYMD, getStartOfDay, getEndOfDay } from '../utils/dateUtils';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useTheme } from '../contexts/ThemeContext';
import { AccessDenied } from '../App';
import TaskModal from '../components/tasks/TaskModal';
import TaskCard from '../components/tasks/TaskCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ExpensesView: React.FC = () => {
    const {
        personalExpenses, addPersonalExpense, updatePersonalExpense, deletePersonalExpense,
        managedAccounts, getCurrencyById, users, getUserById, currencies
    } = useData();
    const { user } = useAuth();
    const { theme } = useTheme();

    const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
    
    const tomanCurrency = useMemo(() => currencies.find(c => c.code === TOMAN_CURRENCY_CODE), [currencies]);

    const [expenseFilters, setExpenseFilters] = useState({
        startDate: '',
        endDate: '',
        category: '',
        userId: '',
        currencyId: '',
    });
    
    useEffect(() => {
        if (tomanCurrency && !expenseFilters.currencyId) {
        setExpenseFilters(prev => ({ ...prev, currencyId: tomanCurrency.id }));
        }
    }, [tomanCurrency, expenseFilters.currencyId]);

    const initialFormState = {
        amount: 0,
        managedAccountId: '',
        category: PERSONAL_EXPENSE_CATEGORIES[0],
        description: '',
        formDate: toYMD(new Date()),
    };
    const [formState, setFormState] = useState(initialFormState);

    const visibleExpenses = useMemo(() => {
        let expenses = personalExpenses;
        if (user?.role !== UserRole.ADMIN) {
        expenses = expenses.filter(e => e.userId === user?.id);
        }
        
        return expenses.filter(e => {
        if (expenseFilters.currencyId && e.currencyId !== expenseFilters.currencyId) return false;
        if (expenseFilters.startDate && new Date(e.date) < getStartOfDay(new Date(expenseFilters.startDate))) return false;
        if (expenseFilters.endDate && new Date(e.date) > getEndOfDay(new Date(expenseFilters.endDate))) return false;
        if (expenseFilters.category && e.category !== expenseFilters.category) return false;
        if (user?.role === UserRole.ADMIN && expenseFilters.userId && e.userId !== expenseFilters.userId) return false;
        return true;
        });
    }, [personalExpenses, user, expenseFilters]);

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFormDateChange = (value: string) => {
        setFormState(prev => ({ ...prev, formDate: value }));
    };

    const handleNumberChange = (name: string, value: number) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const openModalForNew = () => {
        setEditingExpense(null);
        setFormState(initialFormState);
        setExpenseModalOpen(true);
    };

    const openModalForEdit = (expense: PersonalExpense) => {
        setEditingExpense(expense);
        setFormState({
        amount: expense.amount,
        managedAccountId: expense.managedAccountId,
        category: expense.category,
        description: expense.description,
        formDate: toYMD(new Date(expense.date)),
        });
        setExpenseModalOpen(true);
    };
    
    const handleDelete = (expenseId: string) => {
        const expense = personalExpenses.find(e => e.id === expenseId);
        if (!expense || !user) return;
        if (user.role !== UserRole.ADMIN && user.id !== expense.userId) {
            alert("شما اجازه حذف این هزینه را ندارید.");
            return;
        }
        if (window.confirm("آیا از حذف این هزینه مطمئن هستید؟ مبلغ به حساب مربوطه بازگردانده می‌شود.")) {
        deletePersonalExpense(expenseId, user.id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const { amount, managedAccountId, category, description, formDate } = formState;

        if (amount <= 0 || !managedAccountId || !category) {
        alert("لطفاً تمام فیلدهای لازم را پر کنید و مبلغ باید بیشتر از صفر باشد.");
        return;
        }
        
        const localDate = new Date(formDate);
        const timezoneOffset = localDate.getTimezoneOffset() * 60000;
        const dateInISO = new Date(localDate.getTime() - timezoneOffset).toISOString();

        if (editingExpense) {
        const payload: PersonalExpense = {
            ...editingExpense,
            amount,
            managedAccountId,
            category,
            description,
            date: dateInISO,
        };
        const success = updatePersonalExpense(payload, user.id);
        if (success) setExpenseModalOpen(false);
        } else {
        const payload = {
            userId: user.id,
            amount,
            managedAccountId,
            category,
            description,
            date: dateInISO,
        };
        const success = addPersonalExpense(payload, user.id);
        if (success) setExpenseModalOpen(false);
        }
    };
    
    const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setExpenseFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFilterDateChange = (name: 'startDate' | 'endDate', value: string) => {
        setExpenseFilters(prev => ({ ...prev, [name]: value }));
    };

    const accountOptions = useMemo(() => 
        managedAccounts.map(acc => ({
        value: acc.id,
        label: `${acc.name} (${formatCurrency(acc.balance, getCurrencyById(acc.currencyId)?.code)} ${getCurrencyById(acc.currencyId)?.symbol})`
        })), [managedAccounts, getCurrencyById]);
        
    const categoryOptions = PERSONAL_EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }));
    const userOptions = users.map(u => ({ value: u.id, label: u.username }));
    const currencyFilterOptions = useMemo(() => currencies.map(c => ({ value: c.id, label: c.name })), [currencies]);

    const columns: Column<PersonalExpense>[] = [
        { header: 'تاریخ', accessor: (row) => formatShortDate(row.date) },
        { header: 'دسته‌بندی', accessor: 'category' },
        { header: 'شرح', accessor: 'description', className: 'min-w-[200px]' },
        { header: 'مبلغ', accessor: (row) => formatCurrency(row.amount, getCurrencyById(row.currencyId)?.code), className: 'text-red-600 dark:text-red-400 font-semibold' },
        { header: 'ارز', accessor: (row) => getCurrencyById(row.currencyId)?.symbol },
        { header: 'حساب پرداخت', accessor: (row) => managedAccounts.find(a => a.id === row.managedAccountId)?.name || 'نامشخص' },
        ...(user?.role === UserRole.ADMIN ? [{ header: 'کاربر', accessor: (row: PersonalExpense) => getUserById(row.userId)?.username || 'نامشخص' }] : []),
        {
        header: 'عملیات',
        accessor: (row) => {
            const canEdit = user?.role === UserRole.ADMIN || user?.id === row.userId;
            return canEdit ? (
            <div className="flex space-x-1 space-x-reverse">
                <Button variant="ghost" size="sm" onClick={() => openModalForEdit(row)} title="ویرایش"><EditIcon /></Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)} title="حذف"><DeleteIcon /></Button>
            </div>
            ) : null;
        },
        },
    ];
    
    const isDark = theme === 'dark';
    const textColor = isDark ? '#E5E7EB' : '#374151';
    const selectedCurrencyForCharts = useMemo(() => getCurrencyById(expenseFilters.currencyId), [expenseFilters.currencyId, getCurrencyById]);

    const categoryChartData = useMemo(() => {
        const dataByCategory = new Map<string, number>();
        visibleExpenses.forEach(expense => {
        const currentTotal = dataByCategory.get(expense.category) || 0;
        dataByCategory.set(expense.category, currentTotal + expense.amount);
        });

        const labels = Array.from(dataByCategory.keys());
        const data = Array.from(dataByCategory.values());
        const colors = ['#16a34a', '#ca8a04', '#2563eb', '#7c3aed', '#db2777', '#475569', '#be123c', '#0f766e'];

        return {
        labels,
        datasets: [{
            data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length] + 'E6'),
            borderColor: isDark ? '#374151' : '#fff',
            borderWidth: 2,
        }],
        };
    }, [visibleExpenses, isDark]);

    const monthlyChartData = useMemo(() => {
        const labels: string[] = [];
        const monthlyTotals = new Map<string, number>();
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric', calendar: 'persian' }).format(d));
            monthlyTotals.set(monthString, 0);
        }
        
        visibleExpenses.forEach(e => {
            const expenseDate = new Date(e.date);
            const monthString = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyTotals.has(monthString)) {
                monthlyTotals.set(monthString, monthlyTotals.get(monthString)! + e.amount);
            }
        });

        return {
        labels,
        datasets: [{
            label: 'مجموع هزینه‌ها',
            data: Array.from(monthlyTotals.values()),
            backgroundColor: '#ca8a04',
            borderRadius: 4,
        }],
        };
    }, [visibleExpenses]);
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Vazirmatn' } } } },
        scales: { 
            y: { ticks: { color: textColor, font: { family: 'Vazirmatn' } } },
            x: { ticks: { color: textColor, font: { family: 'Vazirmatn' } } }
        },
    };

    return (
        <div className="flex flex-col h-full">
            <Button onClick={openModalForNew} leftIcon={<PlusIcon className="w-5 h-5" />} className="self-end mb-4">
            ثبت هزینه جدید
            </Button>
        
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card title={`هزینه بر اساس دسته‌بندی (${selectedCurrencyForCharts?.code || '...'})`} className="lg:col-span-1">
                    <div className="h-80 relative">
                        {visibleExpenses.length > 0 ? <Doughnut data={categoryChartData} options={{...chartOptions, plugins: {legend: { display: false }}}} /> : <p className="text-center text-gray-500 pt-16">داده‌ای برای نمایش وجود ندارد.</p>}
                    </div>
                </Card>
                <Card title={`روند هزینه‌ها (${selectedCurrencyForCharts?.code || '...'})`} className="lg:col-span-2">
                    <div className="h-80 relative">
                        {visibleExpenses.length > 0 ? <Bar data={monthlyChartData} options={chartOptions} /> : <p className="text-center text-gray-500 pt-16">داده‌ای برای نمایش وجود ندارد.</p>}
                    </div>
                </Card>
            </div>

            <Card>
                <div className="p-4 border-b dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <JalaliDatePicker label="از تاریخ" value={expenseFilters.startDate} onChange={(date) => handleFilterDateChange('startDate', date)} containerClassName="mb-0"/>
                    <JalaliDatePicker label="تا تاریخ" value={expenseFilters.endDate} onChange={(date) => handleFilterDateChange('endDate', date)} containerClassName="mb-0"/>
                    <Select label="دسته‌بندی" name="category" value={expenseFilters.category} onChange={handleFilterChange} options={categoryOptions} placeholder="همه دسته‌بندی‌ها" containerClassName="mb-0"/>
                    <Select label="ارز" name="currencyId" value={expenseFilters.currencyId} onChange={handleFilterChange} options={currencyFilterOptions} containerClassName="mb-0" />
                    {user?.role === UserRole.ADMIN && (
                        <Select label="کاربر" name="userId" value={expenseFilters.userId} onChange={handleFilterChange} options={userOptions} placeholder="همه کاربران" containerClassName="mb-0"/>
                    )}
                </div>
                <div className="overflow-x-auto">
                <Table<PersonalExpense>
                    columns={columns}
                    data={visibleExpenses}
                    keyExtractor={(row) => row.id}
                />
                </div>
            </Card>

            <Modal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={editingExpense ? "ویرایش هزینه" : "ثبت هزینه جدید"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormattedNumberInput label="مبلغ هزینه" name="amount" value={formState.amount} onValueChange={handleNumberChange} required />
                    <JalaliDatePicker label="تاریخ" value={formState.formDate} onChange={handleFormDateChange} />
                </div>
                <Select label="حساب پرداخت" name="managedAccountId" value={formState.managedAccountId} onChange={handleFormChange} options={accountOptions} placeholder="انتخاب حساب" required />
                <Select label="دسته‌بندی" name="category" value={formState.category} onChange={handleFormChange} options={categoryOptions} required />
                <Input label="شرح هزینه" name="description" value={formState.description} onChange={handleFormChange} required />

                <div className="flex justify-end space-x-2 space-x-reverse pt-3">
                    <Button type="button" variant="ghost" onClick={() => setExpenseModalOpen(false)}>لغو</Button>
                    <Button type="submit" variant="primary">{editingExpense ? "ذخیره تغییرات" : "ثبت هزینه"}</Button>
                </div>
                </form>
            </Modal>
        </div>
    );
}

const COLUMN_HEADERS: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: 'برای انجام',
    [TaskStatus.IN_PROGRESS]: 'در حال انجام',
    [TaskStatus.DONE]: 'انجام شده',
};

const TasksView: React.FC = () => {
    const { tasks, users, updateTask } = useData();
    const { user, hasPermission } = useAuth();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskFilters, setTaskFilters] = useState({ assigneeId: '', searchTerm: ''});
    const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);

    const filteredTasks = useMemo(() => {
        let currentTasks = tasks;
        if (user?.role !== UserRole.ADMIN) {
            currentTasks = tasks.filter(t => t.assigneeId === user?.id || t.createdByUserId === user?.id);
        }
        
        return currentTasks.filter(t => {
            const matchesAssignee = taskFilters.assigneeId ? t.assigneeId === taskFilters.assigneeId : true;
            const matchesSearch = taskFilters.searchTerm ? 
                t.title.toLowerCase().includes(taskFilters.searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(taskFilters.searchTerm.toLowerCase())
                : true;
            return matchesAssignee && matchesSearch;
        });
    }, [tasks, user, taskFilters]);
    
    const tasksByStatus = useMemo(() => {
        return filteredTasks.reduce((acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
        }, {} as Record<TaskStatus, Task[]>);
    }, [filteredTasks]);

    const handleOpenModal = (task: Task | null) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setTaskFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        e.dataTransfer.setData("taskId", task.id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        if(status !== draggedOverColumn) {
            setDraggedOverColumn(status);
        }
    };
    
    const handleDragLeave = () => {
        setDraggedOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find(t => t.id === taskId);
        if (task && user) {
        updateTask({ ...task, status: newStatus }, user.id);
        }
        setDraggedOverColumn(null);
    };

    const userOptions = users.map(u => ({ value: u.id, label: u.username }));

    return (
        <div className="flex flex-col h-full">
            {hasPermission('manage_tasks') && (
                <Button onClick={() => handleOpenModal(null)} leftIcon={<PlusIcon className="w-5 h-5"/>} className="self-end mb-4">
                    کار جدید
                </Button>
            )}
        
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-custom flex flex-wrap gap-4 items-center">
                <Input 
                    name="searchTerm"
                    placeholder="جستجو در عنوان یا شرح کار..."
                    value={taskFilters.searchTerm}
                    onChange={handleFilterChange}
                    containerClassName="flex-grow mb-0"
                />
                {user?.role === UserRole.ADMIN && (
                    <Select
                        name="assigneeId"
                        value={taskFilters.assigneeId}
                        onChange={handleFilterChange}
                        options={userOptions}
                        placeholder="همه کاربران"
                        containerClassName="mb-0"
                    />
                )}
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(COLUMN_HEADERS) as TaskStatus[]).map(status => (
                <div
                    key={status}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDrop={(e) => handleDrop(e, status)}
                    onDragLeave={handleDragLeave}
                    className={`bg-gray-100/50 dark:bg-gray-900/50 p-4 rounded-xl transition-colors duration-300 ${draggedOverColumn === status ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}
                >
                    <h2 className="font-semibold text-lg text-primary-600 dark:text-primary-400 mb-4 pb-2 border-b-2 border-accent-500/50">
                    {COLUMN_HEADERS[status]}
                    <span className="text-sm font-normal text-gray-500 mr-2">({tasksByStatus[status]?.length || 0})</span>
                    </h2>
                    <div className="space-y-4 h-[calc(100vh-32rem)] overflow-y-auto pr-2">
                    {tasksByStatus[status]
                        ?.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map(task => (
                        <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => handleOpenModal(task)}
                        onDragStart={(e) => handleDragStart(e, task)}
                        />
                    ))}
                    </div>
                </div>
                ))}
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                task={editingTask}
            />
        </div>
    );
};


const PersonalAffairsPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState<'expenses' | 'tasks'>('expenses');

    return (
        <div>
            <PageHeader title="امور شخصی و کارها" />
             <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                    <button onClick={() => setActiveTab('expenses')} className={`${activeTab === 'expenses' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        هزینه‌های شخصی
                    </button>
                    {hasPermission('view_tasks') && (
                        <button onClick={() => setActiveTab('tasks')} className={`${activeTab === 'tasks' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            کارها
                        </button>
                    )}
                </nav>
            </div>
            <div>
                {activeTab === 'expenses' && <ExpensesView />}
                {activeTab === 'tasks' && (hasPermission('view_tasks') ? <TasksView /> : <AccessDenied />)}
            </div>
        </div>
    );
};

export default PersonalAffairsPage;