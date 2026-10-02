/**
 * KONFIGURASI TERPUSAT DATABASE GOOGLE SPREADSHEET & WHATSAPP GATEWAY
 * 
 * Pengaturan ini disinkronkan langsung dari file Code.gs (Google Apps Script).
 * Seluruh pengguna (Pelanggan, Kasir, dan Administrator) otomatis terhubung
 * ke database dan gateway yang sama tanpa perlu mengatur manual di pengaturan akun.
 */

export const GAS_CONFIG = {
  // ID Google Spreadsheet Master Toko Alinea Desain
  SPREADSHEET_ID: '1kxoXXgoB_eq1HiWbTbxZ1qzodvQs3ZdlAPqvzl5Jmqc',

  // Gateway Notifikasi WhatsApp (Fonnte)
  WA_API_KEY: '9JPQEQhViYsp7Q6njJQv',
  WA_URL: 'https://api.fonnte.com/send',
  WA_PROVIDER: 'fonnte',
  WA_SENDER_NUMBER: '085815950700',

  // Fallback URL (opsional, jika disetel via variabel lingkungan)
  DEFAULT_WEB_APP_URL: ((import.meta as any).env?.VITE_GAS_URL as string) || ''
};

/**
 * Mendapatkan URL Web App aktif untuk sinkronisasi.
 * Mengutamakan URL yang diinputkan secara manual oleh pengguna di Pengaturan Toko.
 */
export function getActiveGasUrl(configuredUrl?: string): string {
  if (configuredUrl && typeof configuredUrl === 'string' && configuredUrl.trim().startsWith('http')) {
    return configuredUrl.trim();
  }
  const envUrl = (import.meta as any).env?.VITE_GAS_URL as string;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim();
  }
  return (configuredUrl || '').trim();
}

/**
 * Cek apakah aplikasi berjalan langsung di lingkungan Google Apps Script Web App (HtmlService)
 */
export function isRunningInAppsScript(): boolean {
  return typeof window !== 'undefined' && !!(window as any).google?.script?.run;
}
