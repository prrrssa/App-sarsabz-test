// pages/TasksPage.tsx
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { Task, TaskStatus, UserRole } from '../types';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { PlusIcon } from '../constants';
import { AccessDenied } from '../App';
import TaskModal from '../components/tasks/TaskModal';
import TaskCard from '../components/tasks/TaskCard';
import Select from '../components/common/Select';
import Input from '../components/common/Input';

const COLUMN_HEADERS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'برای انجام',
  [TaskStatus.IN_PROGRESS]: 'در حال انجام',
  [TaskStatus.DONE]: 'انجام شده',
};

const TasksPage: React.FC = () => {
  const { tasks, users, updateTask } = useData();
  const { user, hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({ assigneeId: '', searchTerm: ''});
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);

  const filteredTasks = useMemo(() => {
    let currentTasks = tasks;
    if (user?.role !== UserRole.ADMIN) {
        currentTasks = tasks.filter(t => t.assigneeId === user?.id || t.createdByUserId === user?.id);
    }
    
    return currentTasks.filter(t => {
        const matchesAssignee = filters.assigneeId ? t.assigneeId === filters.assigneeId : true;
        const matchesSearch = filters.searchTerm ? 
            t.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
            : true;
        return matchesAssignee && matchesSearch;
    });
  }, [tasks, user, filters]);
  
  const tasksByStatus = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [filteredTasks]);

  const handleOpenModal = (task: Task | null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // --- Drag and Drop Handlers ---
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

  if (!hasPermission('view_tasks')) {
    return <AccessDenied />;
  }

  const userOptions = users.map(u => ({ value: u.id, label: u.username }));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="مدیریت کارها">
        {hasPermission('manage_tasks') && (
          <Button onClick={() => handleOpenModal(null)} leftIcon={<PlusIcon className="w-5 h-5"/>}>
            کار جدید
          </Button>
        )}
      </PageHeader>
      
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-custom flex flex-wrap gap-4 items-center">
        <Input 
            name="searchTerm"
            placeholder="جستجو در عنوان یا شرح کار..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            containerClassName="flex-grow mb-0"
        />
        {user?.role === UserRole.ADMIN && (
             <Select
                name="assigneeId"
                value={filters.assigneeId}
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
            <div className="space-y-4 h-[calc(100vh-22rem)] overflow-y-auto pr-2">
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
      />
    </div>
  );
};

export default TasksPage;
