
import React, { useState } from 'react';
import Card from '../common/Card';
import { WIDGETS } from './widgetRegistry';
import { formatNumber } from '../../utils/formatters';

const CalculatorWidget: React.FC = () => {
    const [displayValue, setDisplayValue] = useState('0');
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const handleDigitClick = (digit: string) => {
        if (waitingForOperand) {
            setDisplayValue(digit);
            setWaitingForOperand(false);
        } else {
            setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
        }
    };
    
    const handleDecimalClick = () => {
        if (!displayValue.includes('.')) {
            setDisplayValue(displayValue + '.');
        }
    };
    
    const handleClearClick = () => {
        setDisplayValue('0');
        setPreviousValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };
    
    const handleOperatorClick = (nextOperator: string) => {
        const inputValue = parseFloat(displayValue);
        
        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operator) {
            const result = calculate(previousValue, inputValue, operator);
            setPreviousValue(result);
            setDisplayValue(String(result));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };
    
    const handleEqualsClick = () => {
        const inputValue = parseFloat(displayValue);
        if (operator && previousValue !== null) {
            const result = calculate(previousValue, inputValue, operator);
            setPreviousValue(null);
            setDisplayValue(String(result));
            setOperator(null);
            setWaitingForOperand(true);
        }
    };

    const calculate = (prev: number, current: number, op: string): number => {
        switch (op) {
            case '+': return prev + current;
            case '-': return prev - current;
            case '*': return prev * current;
            case '/': return prev / current;
            default: return current;
        }
    };

    const CalcButton: React.FC<{onClick: () => void, children: React.ReactNode, className?: string}> = ({ onClick, children, className }) => (
        <button onClick={onClick} className={`text-xl font-semibold rounded-lg h-14 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-400 ${className}`}>
            {children}
        </button>
    );

    return (
        <Card title={WIDGETS.calculator.title}>
            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg h-80 flex flex-col">
                <div className="bg-white dark:bg-gray-800 text-right rounded-lg p-3 mb-2 shadow-inner h-20 flex items-center justify-end">
                    <p className="text-4xl font-mono text-gray-800 dark:text-gray-100 break-all">{formatNumber(parseFloat(displayValue) || 0, 'en-US')}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 flex-grow">
                    <CalcButton onClick={handleClearClick} className="col-span-2 bg-red-200 dark:bg-red-800/60 hover:bg-red-300 dark:hover:bg-red-700/60 text-red-700 dark:text-red-200">C</CalcButton>
                    <CalcButton onClick={() => handleOperatorClick('/')} className="bg-accent-200 dark:bg-accent-800/60 hover:bg-accent-300 dark:hover:bg-accent-700/60 text-accent-800 dark:text-accent-100">/</CalcButton>
                    <CalcButton onClick={() => handleOperatorClick('*')} className="bg-accent-200 dark:bg-accent-800/60 hover:bg-accent-300 dark:hover:bg-accent-700/60 text-accent-800 dark:text-accent-100">*</CalcButton>

                    <CalcButton onClick={() => handleDigitClick('7')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">7</CalcButton>
                    <CalcButton onClick={() => handleDigitClick('8')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">8</CalcButton>
                    <CalcButton onClick={() => handleDigitClick('9')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">9</CalcButton>
                    <CalcButton onClick={() => handleOperatorClick('-')} className="bg-accent-200 dark:bg-accent-800/60 hover:bg-accent-300 dark:hover:bg-accent-700/60 text-accent-800 dark:text-accent-100">-</CalcButton>
                    
                    <CalcButton onClick={() => handleDigitClick('4')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">4</CalcButton>
                    <CalcButton onClick={() => handleDigitClick('5')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">5</CalcButton>
                    <CalcButton onClick={() => handleDigitClick('6')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">6</CalcButton>
                    <CalcButton onClick={() => handleOperatorClick('+')} className="bg-accent-200 dark:bg-accent-800/60 hover:bg-accent-300 dark:hover:bg-accent-700/60 text-accent-800 dark:text-accent-100">+</CalcButton>

                    <CalcButton onClick={() => handleDigitClick('1')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">1</CalcButton>
                    <CalcButton onClick={() => handleDigitClick('2')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">2</CalcButton>
                    <CalcButton onClick={() => handleDigitClick('3')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">3</CalcButton>
                    <CalcButton onClick={handleEqualsClick} className="row-span-2 bg-primary-500 hover:bg-primary-600 text-white">=</CalcButton>
                    
                    <CalcButton onClick={() => handleDigitClick('0')} className="col-span-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">0</CalcButton>
                    <CalcButton onClick={handleDecimalClick} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">.</CalcButton>
                </div>
            </div>
        </Card>
    );
};

export default CalculatorWidget;
