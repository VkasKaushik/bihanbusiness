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

export function numberToWordsIndian(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Rupees Zero Only';
  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  let num = Math.round(amount);
  let words = '';

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const remaining = num;

  if (crores > 0) words += convertChunk(crores) + ' Crore ';
  if (lakhs > 0) words += convertChunk(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertChunk(thousands) + ' Thousand ';
  if (remaining > 0) words += convertChunk(remaining) + ' ';

  return 'Rupees ' + words.trim() + ' Only';
}
