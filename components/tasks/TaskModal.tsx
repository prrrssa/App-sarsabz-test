// components/tasks/TaskModal.tsx
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../hooks/useAuth';
import { Task, TaskPriority } from '../../types';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { toYMD } from '../../utils/dateUtils';
import JalaliDatePicker from '../common/JalaliDatePicker';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task }) => {
  const { users, addTask, updateTask } = useData();
  const { user } = useAuth();
  
  const initialFormState = {
    title: '',
    description: '',
    assigneeId: user?.id || '',
    dueDate: toYMD(new Date()),
    priority: TaskPriority.MEDIUM,
  };

  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    if (task) {
      setFormState({
        title: task.title,
        description: task.description || '',
        assigneeId: task.assigneeId,
        dueDate: toYMD(new Date(task.dueDate)),
        priority: task.priority,
      });
    } else {
      setFormState(initialFormState);
    }
  }, [task, isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleDateChange = (value: string) => {
    setFormState(prev => ({ ...prev, dueDate: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formState.title || !formState.assigneeId || !formState.dueDate) {
        alert("لطفا تمام فیلدهای الزامی را پر کنید.");
        return;
    }
    
    const localDate = new Date(formState.dueDate);
    const timezoneOffset = localDate.getTimezoneOffset() * 60000;
    const dateInISO = new Date(localDate.getTime() - timezoneOffset).toISOString();
    
    if (task) { // Editing existing task
      updateTask({ ...task, ...formState, dueDate: dateInISO }, user.id);
    } else { // Creating new task
      addTask({ ...formState, dueDate: dateInISO, createdByUserId: user.id }, user.id);
    }
    onClose();
  };

  const userOptions = users.map(u => ({ value: u.id, label: u.username }));
  const priorityOptions = [
    { value: TaskPriority.LOW, label: 'کم' },
    { value: TaskPriority.MEDIUM, label: 'متوسط' },
    { value: TaskPriority.HIGH, label: 'زیاد' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? "ویرایش کار" : "ایجاد کار جدید"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="عنوان کار" name="title" value={formState.title} onChange={handleChange} required />
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شرح (اختیاری)</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-accent-400 focus:border-transparent sm:text-sm"
            value={formState.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="محول به" name="assigneeId" value={formState.assigneeId} onChange={handleChange} options={userOptions} required />
            <JalaliDatePicker label="تاریخ سررسید" value={formState.dueDate} onChange={handleDateChange} />
        </div>
        <Select label="اولویت" name="priority" value={formState.priority} onChange={handleChange} options={priorityOptions} required />
        
        <div className="flex justify-end space-x-2 space-x-reverse pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>لغو</Button>
            <Button type="submit" variant="primary">{task ? "ذخیره تغییرات" : "ایجاد کار"}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;