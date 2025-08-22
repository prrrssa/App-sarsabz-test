
import React, { useState, useEffect } from 'react';
import { formatNumber } from '../../utils/formatters';
import Input, { InputProps } from './Input';

interface FormattedNumberInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'name'> {
  value: number | null | undefined;
  onValueChange: (name: string, value: number) => void;
  name: string;
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({ value, onValueChange, name, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState<string>(formatNumber(value));

  useEffect(() => {
    // Update the display value from the parent state only when not focused
    if (!isFocused) {
      setLocalValue(formatNumber(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Switch to raw number string for editing, preserving potential negative sign
    setLocalValue(value != null ? String(value) : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // On blur, parse the local value and notify the parent
    const parsed = parseFloat(localValue);
    // Handles cases like "", "-", or ".-" which parseFloat returns NaN for.
    // Also handles when user types just a "."
    const newValue = isNaN(parsed) || localValue.trim() === '.' || localValue.trim() === '-' ? 0 : parsed;
    onValueChange(name, newValue);
    // The useEffect will reformat the display value after the parent state updates
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, a single decimal point, and an optional leading hyphen
    const re = /^-?[0-9]*\.?[0-9]*$/;
    if (e.target.value === '' || e.target.value === '-' || re.test(e.target.value)) {
      setLocalValue(e.target.value);
    }
  };

  return (
    <Input
      {...props}
      name={name}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};

export default FormattedNumberInput;
