import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { WIDGETS } from './widgetRegistry';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';

interface CustomizeDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLayout: string[];
}

const UpArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const DownArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const RemoveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({ isOpen, onClose, currentLayout }) => {
    const { user } = useAuth();
    const { updateDashboardLayout } = useData();
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    
    useEffect(() => {
        if(isOpen) {
            setActiveWidgets(currentLayout);
        }
    }, [currentLayout, isOpen]);

    const availableWidgets = useMemo(() => {
        return Object.keys(WIDGETS).filter(id => !activeWidgets.includes(id));
    }, [activeWidgets]);
    
    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newLayout = [...activeWidgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newLayout.length) return;
        [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
        setActiveWidgets(newLayout);
    };

    const addWidget = (id: string) => {
        setActiveWidgets(prev => [...prev, id]);
    };
    
    const removeWidget = (id: string) => {
        setActiveWidgets(prev => prev.filter(widgetId => widgetId !== id));
    };

    const handleSave = async () => {
        if(user) {
            await updateDashboardLayout(user.id, activeWidgets);
        }
        onClose();
    };
    
    const ListItem: React.FC<{id: string, children: React.ReactNode}> = ({id, children}) => (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <span className="font-medium text-gray-800 dark:text-gray-200">{WIDGETS[id].title}</span>
            <div className="flex items-center gap-1">
                {children}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="شخصی‌سازی داشبورد" size="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2 text-primary-600 dark:text-primary-400">ویجت‌های فعال</h3>
                    <div className="space-y-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg h-96 overflow-y-auto">
                        {activeWidgets.map((id, index) => (
                           <ListItem key={id} id={id}>
                               <Button size="sm" variant="ghost" onClick={() => moveWidget(index, 'up')} disabled={index === 0}><UpArrowIcon /></Button>
                               <Button size="sm" variant="ghost" onClick={() => moveWidget(index, 'down')} disabled={index === activeWidgets.length - 1}><DownArrowIcon /></Button>
                               <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40" onClick={() => removeWidget(id)}><RemoveIcon /></Button>
                           </ListItem>
                        ))}
                         {activeWidgets.length === 0 && <p className="text-center text-gray-500 pt-8">هیچ ویجتی فعال نیست.</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2 text-primary-600 dark:text-primary-400">ویجت‌های موجود</h3>
                    <div className="space-y-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg h-96 overflow-y-auto">
                         {availableWidgets.map(id => (
                           <ListItem key={id} id={id}>
                               <Button size="sm" variant="ghost" className="text-green-500 hover:bg-green-100 dark:hover:bg-green-900/40" onClick={() => addWidget(id)}><AddIcon /></Button>
                           </ListItem>
                        ))}
                        {availableWidgets.length === 0 && <p className="text-center text-gray-500 pt-8">تمام ویجت‌ها فعال هستند.</p>}
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-6 mt-4 border-t dark:border-gray-700">
                <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
                <Button type="button" variant="primary" onClick={handleSave}>ذخیره چیدمان</Button>
            </div>
        </Modal>
    );
};

export default CustomizeDashboardModal;