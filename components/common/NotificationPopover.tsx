// components/common/NotificationPopover.tsx
import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { formatDate } from '../../utils/formatters';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const navigate = useNavigate();

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications
      .filter(n => n.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // Show latest 10
  }, [notifications, user]);

  if (!isOpen) return null;
  
  const handleNotificationClick = (id: string, taskId?: string) => {
    markNotificationAsRead(id);
    if(taskId) {
        navigate('/tasks');
    }
    onClose();
  };

  const handleMarkAllAsRead = () => {
    if(user) {
        markAllNotificationsAsRead(user.id);
    }
  }

  return (
    <div className="absolute top-full rtl:left-0 ltr:right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50">
      <div className="p-3 flex justify-between items-center border-b dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">اعلان‌ها</h3>
        <Button onClick={handleMarkAllAsRead} variant="ghost" size="sm">علامت‌گذاری همه به عنوان خوانده شده</Button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {userNotifications.length === 0 ? (
          <p className="text-center text-gray-500 py-6">هیچ اعلان جدیدی وجود ندارد.</p>
        ) : (
          userNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id, notif.relatedTaskId)}
              className={`p-3 border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${!notif.isRead ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
            </div>
          ))
        )}
      </div>
      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 text-center">
        {/* We can add a "View All" link here later if needed */}
      </div>
    </div>
  );
};

export default NotificationPopover;
