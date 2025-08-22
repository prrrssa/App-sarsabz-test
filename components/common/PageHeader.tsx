
import React from 'react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode; // For buttons or other actions
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
  return (
    <div className="mb-6 pb-3 border-b-2 border-accent-400/50 dark:border-accent-500/30 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h1 className="text-2xl md:text-3xl font-bold text-primary-700 dark:text-primary-300 text-center sm:text-right w-full sm:w-auto">{title}</h1>
      {children && <div className="flex items-center space-x-2 space-x-reverse">{children}</div>}
    </div>
  );
};

export default PageHeader;