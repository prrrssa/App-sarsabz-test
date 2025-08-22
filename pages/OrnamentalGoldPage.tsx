
import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { OrnamentalGold } from '../../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import FormattedNumberInput from '../components/common/FormattedNumberInput';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Table, { Column } from '../components/common/Table';
import { PlusIcon, EditIcon, DeleteIcon, CubeIcon, ScaleIcon, PaperClipIcon } from '../constants';
import { formatCurrency, formatNumber, formatShortDate, formatDate } from '../../utils/formatters';
import { compressImage } from '../../utils/imageUtils';
import { AccessDenied } from '../App';
import JalaliDatePicker from '../components/common/JalaliDatePicker';
import { toYMD } from '../../utils/dateUtils';
import { TOMAN_CURRENCY_CODE } from '../constants';
import ImageViewerModal from '../components/common/ImageViewerModal';

const OrnamentalGoldPage: React.FC = () => {
    const { 
        ornamentalGoldItems, addOrnamentalGoldItem, updateOrnamentalGoldItem,
        deleteOrnamentalGoldItem, sellOrnamentalGoldItem, customers,
        transactions, getCustomerById, getUserById
    } = useData();

    const { user, hasPermission } = useAuth();

    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);


    const [editingItem, setEditingItem] = useState<OrnamentalGold | null>(null);
    const [itemToSell, setItemToSell] = useState<OrnamentalGold | null>(null);
    const [viewingItem, setViewingItem] = useState<OrnamentalGold | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'available' | 'sold'>('available');

    const filteredItems = useMemo(() => {
        return ornamentalGoldItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ornamentalGoldItems, searchTerm]);

    const availableItems = useMemo(() => {
        return filteredItems.filter(i => i.status === 'available').sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }, [filteredItems]);

    const soldItems = useMemo(() => {
        return filteredItems
            .filter(i => i.status === 'sold')
            .map(item => {
                const saleTransaction = transactions.find(t => t.id === item.soldTransactionId);
                const customer = saleTransaction ? getCustomerById(saleTransaction.customerId || '') : null;
                const sellingPrice = saleTransaction ? saleTransaction.sourceAmount : 0;
                const totalCost = (item.costPrice || 0) + (item.purchaseWageAmount || 0);
                const profitLoss = totalCost > 0 && sellingPrice > 0 ? sellingPrice - totalCost : null;

                return {
                    ...item,
                    customerName: customer?.name || 'نامشخص',
                    sellingPrice,
                    profitLoss,
                };
            })
            .sort((a,b) => new Date(b.soldAt!).getTime() - new Date(a.soldAt!).getTime());
    }, [filteredItems, transactions, getCustomerById]);

    const dashboardStats = useMemo(() => {
        const totalAvailableCount = availableItems.length;
        const totalAvailableWeight = availableItems.reduce((sum, item) => sum + item.weight, 0);
        return { totalAvailableCount, totalAvailableWeight };
    }, [availableItems]);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsAddEditModalOpen(true);
    };

    const handleOpenEditModal = (item: OrnamentalGold) => {
        setEditingItem(item);
        setIsAddEditModalOpen(true);
    };

    const handleOpenSellModal = (item: OrnamentalGold) => {
        setItemToSell(item);
        setIsSellModalOpen(true);
    };
    
    const handleOpenDetailsModal = (item: OrnamentalGold) => {
        setViewingItem(item);
        setIsDetailsModalOpen(true);
    };

    const handleDelete = (item: OrnamentalGold) => {
        if (window.confirm(`آیا از حذف قطعه "${item.name}" مطمئن هستید؟ این عمل تراکنش فروش مربوطه را نیز حذف خواهد کرد.`)) {
            if (user) deleteOrnamentalGoldItem(item.id, user.id);
        }
    };
    
    if (!hasPermission('view_ornamental_gold')) {
        return <AccessDenied />;
    }
    
    const soldItemsColumns: Column<(typeof soldItems)[0]>[] = [
        { header: 'کد', accessor: 'code', className: "font-mono" },
        { header: 'نام', accessor: 'name' },
        { header: 'تاریخ فروش', accessor: (row) => formatShortDate(row.soldAt!) },
        { header: 'مشتری', accessor: 'customerName' },
        { header: 'قیمت فروش', accessor: (row) => formatCurrency(row.sellingPrice, TOMAN_CURRENCY_CODE) },
        { 
            header: 'سود/زیان', 
            accessor: (row) => {
                if (row.profitLoss === null || row.profitLoss === undefined) return '---';
                const isProfit = row.profitLoss >= 0;
                return <span className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(row.profitLoss, TOMAN_CURRENCY_CODE)}</span>;
            }
        },
        { header: 'عملیات', accessor: (row) => (
          hasPermission('manage_ornamental_gold') ? (
              <div className="flex space-x-1 space-x-reverse">
                  <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="حذف"><DeleteIcon /></Button>
              </div>
          ) : '---'
        )}
    ];
    
    const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode; title: string; value: string; colorClass: string }) => (
        <Card bodyClassName="!p-0" className="overflow-hidden">
            <div className="flex items-center">
                <div className={`p-5 text-white ${colorClass}`}>{icon}</div>
                <div className="px-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
                </div>
            </div>
        </Card>
    );

    return (
        <div>
            <PageHeader title="مدیریت طلای زینتی">
                {hasPermission('manage_ornamental_gold') && (
                    <Button onClick={handleOpenAddModal} leftIcon={<PlusIcon />}>افزودن قطعه جدید</Button>
                )}
            </PageHeader>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <StatCard icon={<CubeIcon className="w-8 h-8"/>} title="تعداد قطعات موجود" value={formatNumber(dashboardStats.totalAvailableCount)} colorClass="bg-blue-500" />
                <StatCard icon={<ScaleIcon className="w-8 h-8"/>} title="مجموع وزن موجود (گرم)" value={formatNumber(dashboardStats.totalAvailableWeight)} colorClass="bg-yellow-500" />
            </div>

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                    <button onClick={() => setActiveTab('available')} className={`${activeTab === 'available' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        قطعات موجود ({availableItems.length})
                    </button>
                    <button onClick={() => setActiveTab('sold')} className={`${activeTab === 'sold' ? 'border-accent-500 text-primary-600 dark:text-accent-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        قطعات فروخته شده ({soldItems.length})
                    </button>
                </nav>
            </div>
            
            <Input placeholder="جستجو بر اساس نام یا کد..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} containerClassName="mb-6" />

            {activeTab === 'available' && (
                availableItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {availableItems.map(item => (
                            <div key={item.id} onClick={() => handleOpenDetailsModal(item)} className="cursor-pointer group">
                                <Card className="flex flex-col h-full border border-transparent group-hover:shadow-xl dark:group-hover:shadow-accent-500/10 group-hover:border-accent-300 dark:group-hover:border-accent-600 transition-all duration-300">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover"/>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-bold text-accent-700 dark:text-accent-400">{item.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">کد: {item.code}</p>
                                        </div>
                                        <div className="mt-4 text-sm space-y-2">
                                            <div className="flex justify-between"><span>وزن:</span> <span className="font-semibold">{formatNumber(item.weight)} گرم</span></div>
                                            {item.costPrice && <div className="flex justify-between"><span>قیمت خرید:</span> <span className="font-semibold">{formatCurrency(item.costPrice, TOMAN_CURRENCY_CODE)}</span></div>}
                                            <div className="flex justify-between"><span>تاریخ افزودن:</span> <span className="font-semibold">{formatShortDate(item.addedAt)}</span></div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">هیچ قطعه‌ی موجودی یافت نشد.</div>
                )
            )}
            
            {activeTab === 'sold' && (
                <Card>
                    <Table columns={soldItemsColumns} data={soldItems} keyExtractor={(row) => row.id} onRowClick={handleOpenDetailsModal} />
                </Card>
            )}

            {(isAddEditModalOpen) && <OrnamentalGoldModal isOpen={isAddEditModalOpen} onClose={() => setIsAddEditModalOpen(false)} item={editingItem} />}
            {(isSellModalOpen && itemToSell) && <SellOrnamentalGoldModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} item={itemToSell} />}
            {(isDetailsModalOpen && viewingItem) && <ItemDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} item={viewingItem} onEdit={handleOpenEditModal} onSell={handleOpenSellModal} setViewingImageUrl={setViewingImageUrl} onDelete={handleDelete} />}
            
             <ImageViewerModal
                isOpen={!!viewingImageUrl}
                onClose={() => setViewingImageUrl(null)}
                imageUrl={viewingImageUrl || ''}
                title="مشاهده فاکتور"
            />
        </div>
    );
};

// --- Modals ---
interface OrnamentalGoldModalProps { isOpen: boolean; onClose: () => void; item: OrnamentalGold | null; }
const OrnamentalGoldModal: React.FC<OrnamentalGoldModalProps> = ({ isOpen, onClose, item }) => {
    const { addOrnamentalGoldItem, updateOrnamentalGoldItem, customers } = useData();
    const { user } = useAuth();
    const [formState, setFormState] = useState({
        code: '', name: '', weight: 0, description: '', costPrice: 0, 
        imageUrl: '', purchaseInvoiceUrl: '', purchasedFromCustomerId: '', purchaseWagePercentage: 0
    });
    
    useEffect(() => {
        if (item) {
            setFormState({
                code: item.code, name: item.name, weight: item.weight, description: item.description || '',
                costPrice: item.costPrice || 0, imageUrl: item.imageUrl,
                purchaseInvoiceUrl: item.purchaseInvoiceUrl || '',
                purchasedFromCustomerId: item.purchasedFromCustomerId || '', 
                purchaseWagePercentage: item.purchaseWagePercentage || 0
            });
        } else {
            setFormState({
                code: '', name: '', weight: 0, description: '', costPrice: 0, 
                imageUrl: '', purchaseInvoiceUrl: '', purchasedFromCustomerId: '', purchaseWagePercentage: 0
            });
        }
    }, [item, isOpen]);
    
    const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: `${c.isFavorite ? '⭐ ' : ''}${c.name}` })), [customers]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormState(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleNumberChange = (name: string, value: number) => setFormState(p => ({...p, [name]: value}));
    
    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'purchaseInvoiceUrl') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const compressedImage = await compressImage(file, 800, 0.8);
            setFormState(p => ({ ...p, [field]: compressedImage }));
            e.target.value = ''; // Reset file input
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formState.name || !formState.code || formState.weight <= 0 || !formState.imageUrl) {
            alert("لطفا همه فیلدهای ضروری (کد، نام، وزن، تصویر) را پر کنید."); return;
        }
        const purchaseWageAmount = formState.costPrice && formState.purchaseWagePercentage ? (formState.costPrice * formState.purchaseWagePercentage) / 100 : 0;
        const payload = { ...formState, purchaseWageAmount };
        if (item) updateOrnamentalGoldItem({ ...item, ...payload }, user.id);
        else addOrnamentalGoldItem(payload, user.id);
        onClose();
    }

    return ( <Modal isOpen={isOpen} onClose={onClose} title={item ? "ویرایش قطعه طلا" : "افزودن قطعه طلا جدید"} size="lg"> <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="کد قطعه" name="code" value={formState.code} onChange={handleInputChange} required />
        <Input label="نام قطعه" name="name" value={formState.name} onChange={handleInputChange} required />
        <FormattedNumberInput label="وزن (گرم)" name="weight" value={formState.weight} onValueChange={handleNumberChange} required />
        <Input label="توضیحات" name="description" value={formState.description} onChange={handleInputChange} />
        <FormattedNumberInput label="قیمت خرید (تومان)" name="costPrice" value={formState.costPrice} onValueChange={handleNumberChange} />
        <FormattedNumberInput label="اجرت خرید (%)" name="purchaseWagePercentage" value={formState.purchaseWagePercentage} onValueChange={handleNumberChange} />
        <Select label="خریداری شده از مشتری (اختیاری)" name="purchasedFromCustomerId" value={formState.purchasedFromCustomerId} onChange={handleInputChange} options={customerOptions} placeholder="---" />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تصویر قطعه</label>
            <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={(e) => handleImageChange(e, 'imageUrl')} />
            {formState.imageUrl && <img src={formState.imageUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg"/>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">فاکتور خرید (اختیاری)</label>
            <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={(e) => handleImageChange(e, 'purchaseInvoiceUrl')} />
            {formState.purchaseInvoiceUrl && <img src={formState.purchaseInvoiceUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg"/>}
        </div>
        <div className="flex justify-end pt-3 gap-2"><Button type="button" variant="ghost" onClick={onClose}>لغو</Button><Button type="submit">{item ? 'ذخیره' : 'افزودن'}</Button></div>
    </form> </Modal> );
};

interface SellOrnamentalGoldModalProps { isOpen: boolean; onClose: () => void; item: OrnamentalGold; }
const SellOrnamentalGoldModal: React.FC<SellOrnamentalGoldModalProps> = ({ isOpen, onClose, item }) => {
    const { sellOrnamentalGoldItem, customers } = useData();
    const { user } = useAuth();
    const [formState, setFormState] = useState({ customerId: '', sellingPrice: 0, notes: '', formDate: toYMD(new Date()), receiptImage: undefined as (string | undefined) });
    const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: `${c.isFavorite ? '⭐ ' : ''}${c.name}` })), [customers]);
    const handleInputChange = (e: ChangeEvent<any>) => setFormState(p => ({...p, [e.target.name]: e.target.value}));
    const handleNumberChange = (name: string, value: number) => setFormState(p => ({...p, [name]: value}));
    const handleDateChange = (value: string) => setFormState(p => ({ ...p, formDate: value }));
    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const compressedImage = await compressImage(file, 800, 0.8);
            setFormState(p => ({ ...p, receiptImage: compressedImage }));
            e.target.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!user || !formState.customerId || formState.sellingPrice <= 0) { alert("لطفا مشتری و قیمت فروش را به درستی وارد کنید."); return; }
        const localDate = new Date(formState.formDate);
        const timezoneOffset = localDate.getTimezoneOffset() * 60000;
        const dateInISO = new Date(localDate.getTime() - timezoneOffset).toISOString();
        const success = sellOrnamentalGoldItem(item.id, { ...formState, date: dateInISO, receiptImage: formState.receiptImage }, user.id);
        if (success) onClose();
    };
    
    return ( <Modal isOpen={isOpen} onClose={onClose} title={`فروش قطعه: ${item.name}`}> <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="مشتری" name="customerId" value={formState.customerId} onChange={handleInputChange} options={customerOptions} placeholder="انتخاب مشتری" required />
        <FormattedNumberInput label="قیمت فروش (تومان)" name="sellingPrice" value={formState.sellingPrice} onValueChange={handleNumberChange} required />
        <Input label="یادداشت (اختیاری)" name="notes" value={formState.notes} onChange={handleInputChange} />
        <JalaliDatePicker label="تاریخ فروش" value={formState.formDate} onChange={handleDateChange} />
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">فاکتور فروش (اختیاری)</label>
            <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={handleImageChange} />
            {formState.receiptImage && <img src={formState.receiptImage} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg"/>}
        </div>
        <div className="flex justify-end pt-3 gap-2"><Button type="button" variant="ghost" onClick={onClose}>لغو</Button><Button type="submit">ثبت فروش</Button></div>
    </form> </Modal> );
};

interface ItemDetailsModalProps { isOpen: boolean; onClose: () => void; item: OrnamentalGold; onEdit: (item: OrnamentalGold) => void; onSell: (item: OrnamentalGold) => void; setViewingImageUrl: (url: string | null) => void; onDelete: (item: OrnamentalGold) => void;}
const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ isOpen, onClose, item, onEdit, onSell, setViewingImageUrl, onDelete }) => {
    const { transactions, getCustomerById, getUserById } = useData();
    const { hasPermission } = useAuth();

    const saleTransaction = item.soldTransactionId ? transactions.find(t => t.id === item.soldTransactionId) : null;
    const buyer = saleTransaction ? getCustomerById(saleTransaction.customerId || '') : null;
    const seller = item.purchasedFromCustomerId ? getCustomerById(item.purchasedFromCustomerId) : null;
    const totalCost = (item.costPrice || 0) + (item.purchaseWageAmount || 0);
    const profitLoss = (saleTransaction && totalCost > 0) ? saleTransaction.sourceAmount - totalCost : null;

    const DetailRow = ({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) => (
        <div className={`flex justify-between items-baseline py-2 border-b border-gray-100 dark:border-gray-700 ${className}`}>
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-semibold text-right">{value || '---'}</span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`جزئیات قطعه: ${item.name}`} size="4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center">
                    <img src={item.imageUrl} alt={item.name} className="w-full max-w-sm h-auto object-contain rounded-lg shadow-lg mb-4" />
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-accent-700 dark:text-accent-400">{item.name}</h3>
                        <p className="text-md text-gray-500 dark:text-gray-400">کد: {item.code}</p>
                        <p className="text-lg font-semibold mt-2">{formatNumber(item.weight)} گرم</p>
                        {item.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-xs">{item.description}</p>}
                    </div>
                </div>
                <div className="space-y-6">
                    <Card title="اطلاعات خرید">
                        <DetailRow label="تاریخ افزودن" value={formatDate(item.addedAt)} />
                        <DetailRow label="کاربر ثبت کننده" value={getUserById(item.addedByUserId)?.username} />
                        {item.purchaseInvoiceUrl && <DetailRow label="فاکتور خرید" value={<Button variant="ghost" size="sm" onClick={() => setViewingImageUrl(item.purchaseInvoiceUrl!)}><PaperClipIcon/> مشاهده</Button>} />}
                        {seller && <DetailRow label="خریداری شده از" value={seller.name} />}
                        {item.costPrice && <DetailRow label="قیمت خرید" value={`${formatCurrency(item.costPrice, TOMAN_CURRENCY_CODE)} تومان`} />}
                        {item.purchaseWageAmount && <DetailRow label="اجرت خرید" value={`${formatCurrency(item.purchaseWageAmount, TOMAN_CURRENCY_CODE)} تومان (${formatNumber(item.purchaseWagePercentage)}%)`} />}
                        <DetailRow label="ارزش کل خرید" value={`${formatCurrency(totalCost, TOMAN_CURRENCY_CODE)} تومان`} className="bg-gray-50 dark:bg-gray-700/50 font-bold" />
                    </Card>
                    <Card title="اطلاعات فروش">
                        {saleTransaction ? (
                            <>
                                <DetailRow label="تاریخ فروش" value={formatDate(saleTransaction.date)} />
                                <DetailRow label="فروخته شده به" value={buyer?.name} />
                                {saleTransaction.receiptImage && <DetailRow label="فاکتور فروش" value={<Button variant="ghost" size="sm" onClick={() => setViewingImageUrl(saleTransaction.receiptImage!)}><PaperClipIcon/> مشاهده</Button>} />}
                                <DetailRow label="قیمت فروش" value={`${formatCurrency(saleTransaction.sourceAmount, TOMAN_CURRENCY_CODE)} تومان`} />
                                {profitLoss !== null && (
                                    <DetailRow label="سود / زیان" value={<span className={profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(profitLoss, TOMAN_CURRENCY_CODE)} تومان</span>} className="bg-gray-50 dark:bg-gray-700/50 font-bold" />
                                )}
                            </>
                        ) : (
                            <p className="text-center text-gray-500 py-4">این قطعه هنوز فروخته نشده است.</p>
                        )}
                    </Card>
                     {hasPermission('manage_ornamental_gold') && (
                        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                            <Button onClick={() => { onClose(); onDelete(item); }} variant="danger"><DeleteIcon className="ml-2"/> حذف</Button>
                            <Button onClick={() => { onClose(); onEdit(item); }} variant="ghost"><EditIcon className="ml-2"/> ویرایش</Button>
                            {item.status === 'available' && <Button onClick={() => { onClose(); onSell(item); }} variant="secondary">فروش قطعه</Button>}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};


export default OrnamentalGoldPage;