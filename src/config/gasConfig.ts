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

  // URL Deployment Web App Apps Script (Jika ada ENV atau default)
  DEFAULT_WEB_APP_URL: ((import.meta as any).env?.VITE_GAS_URL as string) || ''
};

/**
 * Mendapatkan URL Web App aktif untuk sinkronisasi.
 * Jika URL tidak disetel di storeData, otomatis menggunakan DEFAULT_WEB_APP_URL.
 */
export function getActiveGasUrl(configuredUrl?: string): string {
  if (configuredUrl && configuredUrl.trim().startsWith('http')) {
    return configuredUrl.trim();
  }
  return GAS_CONFIG.DEFAULT_WEB_APP_URL;
}

/**
 * Cek apakah aplikasi berjalan langsung di lingkungan Google Apps Script Web App (HtmlService)
 */
export function isRunningInAppsScript(): boolean {
  return typeof window !== 'undefined' && !!(window as any).google?.script?.run;
}
