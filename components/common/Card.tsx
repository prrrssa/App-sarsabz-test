
import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  actions?: React.ReactNode; // For buttons or other actions in the header
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', bodyClassName = '', actions }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-custom rounded-xl overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center`}>
          {title && <h2 className={`text-lg font-semibold text-primary-700 dark:text-primary-400 ${titleClassName}`}>{title}</h2>}
          {actions && <div className="flex items-center space-x-2 space-x-reverse">{actions}</div>}
        </div>
      )}
      <div className={`p-5 text-gray-800 dark:text-gray-200 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
