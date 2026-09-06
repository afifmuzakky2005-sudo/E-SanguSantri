/**
 * Standard Indonesian Date & Time Utilities (dd/mm/yyyy)
 * Fully compatible with Excel serial dates, various string formats, and JS Dates.
 */

const MONTH_MAP_ID: { [key: string]: number } = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, ags: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12
};

/**
 * Parse any date representation (Excel serial, DD/MM/YYYY, YYYY-MM-DD, Date object, Indonesian text)
 * into a standardized 'YYYY-MM-DD' string for internal database storage.
 */
export function parseExcelDateToYYYYMMDD(rawInput: any): { dateStr: string; isValid: boolean; error?: string } {
  if (rawInput === undefined || rawInput === null || rawInput === '') {
    const today = new Date().toISOString().split('T')[0];
    return { dateStr: today, isValid: true };
  }

  // If already a Date object
  if (rawInput instanceof Date) {
    if (isNaN(rawInput.getTime())) {
      return { dateStr: '', isValid: false, error: 'Format tanggal tidak valid' };
    }
    const y = rawInput.getFullYear();
    const m = String(rawInput.getMonth() + 1).padStart(2, '0');
    const d = String(rawInput.getDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, isValid: true };
  }

  // If numeric (Excel serial date number, e.g. 45540 for 2024-09-05)
  if (typeof rawInput === 'number' || (!isNaN(Number(rawInput)) && Number(rawInput) > 1000 && !String(rawInput).includes('/') && !String(rawInput).includes('-'))) {
    const num = Number(rawInput);
    if (num > 0) {
      // Excel epoch: Dec 30 1899 (taking leap year bug into account)
      const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getUTCFullYear();
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        if (y >= 1900 && y <= 2100) {
          return { dateStr: `${y}-${m}-${d}`, isValid: true };
        }
      }
    }
  }

  const str = String(rawInput).trim();
  if (!str) {
    const today = new Date().toISOString().split('T')[0];
    return { dateStr: today, isValid: true };
  }

  // 1. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with optional time HH:mm or HH:mm:ss)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return {
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isValid: true
      };
    }
  }

  // 2. YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD (with optional time or ISO)
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return {
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isValid: true
      };
    }
  }

  // 3. Textual date: "05 September 2026" or "5-Sep-2026"
  const textDateMatch = str.match(/^(\d{1,2})[\s\-\/]+([a-zA-Z]+)[\s\-\/]+(\d{4})/);
  if (textDateMatch) {
    const day = parseInt(textDateMatch[1], 10);
    const monthStr = textDateMatch[2].toLowerCase();
    const year = parseInt(textDateMatch[3], 10);
    const month = MONTH_MAP_ID[monthStr];

    if (month && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return {
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isValid: true
      };
    }
  }

  // 4. Try generic Date constructor parse
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const y = parsedDate.getFullYear();
    const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const d = String(parsedDate.getDate()).padStart(2, '0');
    if (y >= 1900 && y <= 2100) {
      return { dateStr: `${y}-${m}-${d}`, isValid: true };
    }
  }

  return {
    dateStr: '',
    isValid: false,
    error: `Format tanggal "${str}" tidak dikenali (gunakan format DD/MM/YYYY)`
  };
}

/**
 * Format any date into strictly Indonesian 'dd/mm/yyyy'
 */
export function formatDateDDMMYYYY(dateInput?: string | Date | number | null): string {
  if (dateInput === undefined || dateInput === null || dateInput === '') return '-';

  try {
    // If string like "YYYY-MM-DD"
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      const [y, m, d] = dateInput.trim().split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // If string is already "DD/MM/YYYY"
    if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput.trim())) {
      return dateInput.trim();
    }

    // Use parseExcelDateToYYYYMMDD as helper
    const parsed = parseExcelDateToYYYYMMDD(dateInput);
    if (parsed.isValid && parsed.dateStr) {
      const [y, m, d] = parsed.dateStr.split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      return String(dateInput);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format any date and time into 'dd/mm/yyyy HH:mm'
 */
export function formatDateTimeDDMMYYYY(dateInput?: string | Date | number | null): string {
  if (dateInput === undefined || dateInput === null || dateInput === '') return '-';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      return formatDateDDMMYYYY(dateInput);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format time to 'HH:mm'
 */
export function formatTimeHHMM(dateInput?: string | Date | number | null): string {
  if (dateInput === undefined || dateInput === null || dateInput === '') return '-';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

