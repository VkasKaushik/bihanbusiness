export {
  formatISTDate as formatDate,
  formatISTTime as formatTime,
  formatISTDateTime as formatDateTime,
  formatISTRelativeDate as formatRelativeDate,
  getISTCurrentDateDisplay,
  formatISTDate,
  formatISTTime,
  formatISTDateTime,
  formatISTRelativeDate,
  IST_TIMEZONE,
} from './date-utils';

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const rounded = Math.round(amount);
  return '₹' + rounded.toLocaleString('en-IN');
}

export function formatCompactCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const val = Math.abs(amount);
  if (val >= 100000) {
    const lakhs = (amount / 100000).toFixed(2);
    return `₹${lakhs}L`;
  }
  if (val >= 1000) {
    const thousands = (amount / 1000).toFixed(1);
    return `₹${thousands}k`;
  }
  return formatCurrency(amount);
}
