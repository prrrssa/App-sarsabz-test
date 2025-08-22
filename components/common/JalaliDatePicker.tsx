// components/common/JalaliDatePicker.tsx
import React, { useState, useEffect, useMemo } from 'react';

// Make sure jalaali is available on window
declare global {
    interface Window { jalaali: any; }
}

interface JalaliDatePickerProps {
  label?: string;
  value: string; // Expects 'YYYY-MM-DD'
  onChange: (value: string) => void;
  containerClassName?: string;
}

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({ label, value, onChange, containerClassName = '' }) => {
  const [jDate, setJDate] = useState({ year: 0, month: 0, day: 0 });

  useEffect(() => {
    try {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [gy, gm, gd] = value.split('-').map(Number);
        if (window.jalaali && window.jalaali.toJalaali) {
          const jd = window.jalaali.toJalaali(gy, gm, gd);
          setJDate({ year: jd.jy, month: jd.jm, day: jd.jd });
        }
      } else if (window.jalaali) {
        // Set to today if value is invalid or empty
        const now = new Date();
        const jd = window.jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        setJDate({ year: jd.jy, month: jd.jm, day: jd.jd });
      }
    } catch (e) {
      console.error("Error parsing date for JalaliDatePicker:", value, e);
    }
  }, [value]);

  const handleDateChange = (part: 'year' | 'month' | 'day', newValue: number) => {
    const newJDate = { ...jDate, [part]: newValue };

    // Validate day of month
    if (part === 'month' || part === 'year') {
        const monthLen = window.jalaali.jalaaliMonthLength(newJDate.year, newJDate.month);
        if (newJDate.day > monthLen) {
            newJDate.day = monthLen;
        }
    }
    
    setJDate(newJDate);

    try {
      const gd = window.jalaali.toGregorian(newJDate.year, newJDate.month, newJDate.day);
      const newYMD = `${gd.gy}-${String(gd.gm).padStart(2, '0')}-${String(gd.gd).padStart(2, '0')}`;
      onChange(newYMD);
    } catch (e) {
      console.error("Error converting Jalali to Gregorian:", newJDate, e);
    }
  };

  const todayJalali = useMemo(() => {
    if(!window.jalaali) return { jy: 1403, jm: 1, jd: 1};
    const now = new Date();
    return window.jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const years = useMemo(() => {
    const yearList = [];
    for (let i = todayJalali.jy + 2; i >= 1380; i--) {
      yearList.push({ value: i, label: String(i) });
    }
    return yearList;
  }, [todayJalali]);

  const months = [
    { value: 1, label: 'فروردین' }, { value: 2, label: 'اردیبهشت' }, { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' }, { value: 5, label: 'مرداد' }, { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' }, { value: 8, label: 'آبان' }, { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' }, { value: 11, label: 'بهمن' }, { value: 12, label: 'اسفند' },
  ];

  const daysInMonth = useMemo(() => {
    if (!jDate.year || !jDate.month || !window.jalaali) return [];
    const monthLength = window.jalaali.jalaaliMonthLength(jDate.year, jDate.month);
    return Array.from({ length: monthLength }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
  }, [jDate.year, jDate.month]);

  if (!window.jalaali) {
    return (
      <div className={containerClassName}>
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <p className="text-red-500 text-sm p-2 bg-red-100 dark:bg-red-900/40 rounded">خطا: کتابخانه تقویم بارگذاری نشده است.</p>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        <select value={jDate.day} onChange={e => handleDateChange('day', parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent sm:text-sm rounded-lg">
          <option value={0} disabled>روز</option>
          {daysInMonth.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={jDate.month} onChange={e => handleDateChange('month', parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent sm:text-sm rounded-lg">
          <option value={0} disabled>ماه</option>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={jDate.year} onChange={e => handleDateChange('year', parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent sm:text-sm rounded-lg">
          <option value={0} disabled>سال</option>
          {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
        </select>
      </div>
    </div>
  );
};

export default JalaliDatePicker;
