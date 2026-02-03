const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BANGLA_WEEKDAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

export function toBanglaNumber(num: number): string {
  return num.toString().split('').map(d => BANGLA_DIGITS[parseInt(d)] || d).join('');
}

export function formatBanglaDate(date: Date): string {
  const day = toBanglaNumber(date.getDate());
  const month = BANGLA_MONTHS[date.getMonth()];
  const year = toBanglaNumber(date.getFullYear());
  const weekday = BANGLA_WEEKDAYS[date.getDay()];
  
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatShortBanglaDate(date: Date): string {
  const day = toBanglaNumber(date.getDate());
  const month = BANGLA_MONTHS[date.getMonth()];
  return `${day} ${month}`;
}

export function getDayNumber(startDate: string, currentDate: Date): number {
  const start = new Date(startDate);
  const diffTime = currentDate.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getRemainingDays(endDate: string, currentDate: Date): number {
  const end = new Date(endDate);
  const diffTime = end.getTime() - currentDate.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function getTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function generateDateRange(startDate: string, endDate: string): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  
  return dates;
}
