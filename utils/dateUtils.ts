

// Helper to set time to start of day
export const getStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Helper to set time to end of day
export const getEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const getTodayRange = (): { start: Date, end: Date } => {
  const now = new Date();
  return {
    start: getStartOfDay(now),
    end: getEndOfDay(now),
  };
};

export const getThisWeekRange = (): { start: Date, end: Date } => {
  const now = new Date();
  // In Iran, week starts on Saturday. Saturday is 6 in getDay() where Sunday is 0.
  const dayOfWeek = now.getDay(); 
  const diffToSaturday = (dayOfWeek + 1) % 7; 
  const start = new Date(now);
  start.setDate(now.getDate() - diffToSaturday);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: getStartOfDay(start),
    end: getEndOfDay(end),
  };
};

export const getThisMonthRange = (): { start: Date, end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
  return {
    start: getStartOfDay(start),
    end: getEndOfDay(end),
  };
};

export const getPreviousPeriod = (start: Date, end: Date): { start: Date, end: Date } => {
    const duration = end.getTime() - start.getTime(); // in milliseconds
    const prevEnd = new Date(start.getTime() - 1); // a millisecond before the current period starts
    const prevStart = new Date(prevEnd.getTime() - duration);

    return {
        start: getStartOfDay(prevStart),
        end: getEndOfDay(prevEnd),
    };
};

export const toYMD = (date: Date): string => {
  if(!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};