// components/tasks/TaskCard.tsx
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../hooks/useAuth';
import { Task, TaskPriority, UserRole } from '../../types';
import { formatShortDate } from '../../utils/formatters';
import { EditIcon, DeleteIcon } from '../../constants';
import Button from '../common/Button';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  [TaskPriority.LOW]: { bg: 'bg-gray-200 dark:bg-gray-600', text: 'text-gray-800 dark:text-gray-200', label: 'کم' },
  [TaskPriority.MEDIUM]: { bg: 'bg-yellow-200 dark:bg-yellow-800/60', text: 'text-yellow-800 dark:text-yellow-200', label: 'متوسط' },
  [TaskPriority.HIGH]: { bg: 'bg-red-200 dark:bg-red-800/60', text: 'text-red-800 dark:text-red-200', label: 'زیاد' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDragStart }) => {
  const { getUserById, deleteTask } = useData();
  const { user, hasPermission } = useAuth();

  const assignee = getUserById(task.assigneeId);
  const priorityStyle = PRIORITY_STYLES[task.priority];
  
  const canManage = hasPermission('manage_tasks') && (user?.role === UserRole.ADMIN || user?.id === task.createdByUserId);

  const handleDelete = () => {
    if (canManage && window.confirm(`آیا از حذف کار "${task.title}" مطمئن هستید؟`)) {
      deleteTask(task.id, user!.id);
    }
  };
  
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-custom cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{task.title}</h4>
        {canManage && (
          <div className="flex items-center space-x-1 space-x-reverse flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onEdit} title="ویرایش"><EditIcon className="w-4 h-4" /></Button>
            <Button variant="danger" size="sm" onClick={handleDelete} title="حذف"><DeleteIcon className="w-4 h-4" /></Button>
          </div>
        )}
      </div>
      {task.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
                اولویت: {priorityStyle.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} dark:bg-opacity-30`}>
                مهلت: {formatShortDate(task.dueDate)}
            </span>
        </div>
        <div className="flex items-center" title={`محول شده به: ${assignee?.username}`}>
          <span className="w-6 h-6 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold">
            {assignee?.username.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
