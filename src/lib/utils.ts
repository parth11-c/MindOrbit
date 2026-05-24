import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timeString: string | Date | undefined | null): string {
  if (!timeString) return '';
  let date: Date;
  if (typeof timeString === 'string') {
    if (timeString.includes('T') || timeString.includes('-')) {
      date = new Date(timeString);
    } else {
      const parts = timeString.split(':');
      date = new Date();
      date.setHours(parseInt(parts[0], 10));
      date.setMinutes(parseInt(parts[1], 10));
      if (parts[2]) {
        date.setSeconds(parseInt(parts[2], 10));
      }
    }
  } else {
    date = timeString;
  }
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
