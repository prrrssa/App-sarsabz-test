
import React, { ChangeEventHandler, SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  containerClassName?: string;
  placeholder?: string; // Explicitly define placeholder prop
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  error, 
  options, 
  className = '', 
  containerClassName = '', 
  placeholder, // Destructure placeholder
  ...props // Rest of the props (will not include placeholder)
}) => {
  const baseStyles = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent sm:text-sm rounded-lg disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400";
  const errorStyles = "border-red-500 focus:ring-red-500";

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <select
        id={id}
        className={`${baseStyles} ${error ? errorStyles : ''} ${className}`}
        {...props} // Spread the rest of the props
      >
        {placeholder && <option value="">{placeholder}</option>} 
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;