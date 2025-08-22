// Using Jalali date for Persian calendar if needed, otherwise standard Intl.
// For simplicity, using standard Intl.DateTimeFormat.
// For full Jalali support, a library like 'jalaali-js' would be used.

export const formatDate = (dateString: string | Date, locale: string = 'fa-IR'): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'persian',
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(dateString); // fallback
  }
};

export const formatShortDate = (dateString: string | Date, locale: string = 'fa-IR'): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'persian',
    }).format(date);
  } catch (error) {
    console.error("Error formatting short date:", error);
    return String(dateString); // fallback
  }
};

export const formatCurrency = (
  amount: number | null | undefined,
  currencyCode?: string, // e.g., 'USD', 'IRT'
  locale: string = 'fa-IR'
): string => {
  if (amount === null || amount === undefined) {
    return '';
  }
  try {
    const options: Intl.NumberFormatOptions = {
      style: 'decimal', // Use decimal for general number formatting
      minimumFractionDigits: currencyCode === 'IRT' ? 0 : 2, // Toman usually has no decimals
      maximumFractionDigits: currencyCode === 'IRT' ? 0 : 2,
    };
    // Using toLocaleString with options for consistent formatting
     return amount.toLocaleString(locale, options);

  } catch (error) {
    console.error("Error formatting currency:", error);
    return String(amount); // fallback
  }
};

export const formatNumber = (
  amount: number | null | undefined,
  locale: string = 'fa-IR',
  options?: Intl.NumberFormatOptions
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }
  try {
    const defaultOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
      ...options
    };
    return new Intl.NumberFormat(locale, defaultOptions).format(amount);
  } catch(e) {
    return String(amount);
  }
}