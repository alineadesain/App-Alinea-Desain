/**
 * Service untuk Sinkronisasi Real-Time dengan Google Apps Script Web App & Server
 * Memungkinkan seluruh data (Pesanan, Produk, Customer, Pengeluaran, Toko)
 * tersimpan langsung ke Google Spreadsheet tanpa terkendala CORS browser
 * dan otomatis tersinkronisasi saat aplikasi dibuka di perangkat baru.
 */

import { getActiveGasUrl, isRunningInAppsScript } from '../config/gasConfig';

export interface GasResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  mode?: string;
}

/**
 * Mengambil state data toko dari server penyimpanan (agar perangkat baru langsung tersinkron)
 */
export async function fetchServerState(): Promise<GasResponse> {
  try {
    const res = await fetch('/api/server-data');
    if (res.ok) {
      const json = await res.json();
      if (json.exists && json.data) {
        return {
          success: true,
          message: 'Data berhasil disinkronkan dari server toko',
          data: json.data
        };
      }
    }
  } catch (err) {
    console.warn('Gagal membaca data server lokal:', err);
  }
  return { success: false, message: 'Server data belum tersedia' };
}

/**
 * Menyimpan pembaruan state data toko ke server penyimpanan (agar perangkat lain otomatis terupdate)
 */
export async function saveServerState(payload: any): Promise<GasResponse> {
  try {
    const res = await fetch('/api/server-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, message: json.message || 'Tersimpan di server' };
    }
  } catch (err: any) {
    console.warn('Gagal menyimpan ke server lokal:', err);
  }
  return { success: false, message: 'Gagal koneksi ke server' };
}

/**
 * Mengirim perubahan data ke Google Apps Script Web App
 * Memanfaatkan server proxy /api/gas-proxy untuk mengatasi blokir CORS di semua perangkat/browser.
 */
export async function sendGasAction(
  gasUrl: string | undefined,
  action: string,
  payload: Record<string, any> = {}
): Promise<GasResponse> {
  // 1. Dukungan langsung jika dijalankan di Google Apps Script runtime (google.script.run)
  if (isRunningInAppsScript()) {
    try {
      const gRun = (window as any).google.script.run;
      if (typeof gRun[action] === 'function') {
        gRun[action](payload);
        return { success: true, message: 'Data dikirim via google.script.run' };
      }
    } catch (e: any) {
      console.warn('google.script.run fallback error:', e);
    }
  }

  const effectiveUrl = getActiveGasUrl(gasUrl);
  if (!effectiveUrl) {
    return { success: false, message: 'URL Web App belum dikonfigurasi di Code.gs/Deployment' };
  }

  const cleanUrl = effectiveUrl.trim();

  // 2. Coba kirim via server backend /api/gas-proxy (Bebas CORS & kompatibel di seluruh perangkat)
  try {
    const proxyRes = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: cleanUrl,
        action,
        payload
      })
    });

    if (proxyRes.ok) {
      const proxyJson = await proxyRes.json();
      return {
        success: proxyJson.success !== false,
        message: proxyJson.message || 'Data berhasil dikirim ke Google Sheets (via proxy)',
        data: proxyJson
      };
    }
  } catch (proxyErr) {
    console.warn('Proxy server GAS tidak tersedia, mencoba direct fetch...', proxyErr);
  }

  // 3. Fallback direct browser fetch text/plain
  const requestBody = JSON.stringify({
    action,
    ...payload,
    timestamp: new Date().toISOString()
  });

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: requestBody
    });

    if (res.ok) {
      try {
        const json = await res.json();
        return {
          success: json.success !== false,
          message: json.message || 'Data berhasil dikirim ke Google Sheets',
          data: json
        };
      } catch {
        return {
          success: true,
          message: 'Data terkirim ke Google Sheets'
        };
      }
    }
  } catch (err: any) {
    console.warn('Fetch GAS standar mengembalikan kendala jaringan, mencoba mode no-cors...', err);
  }

  // 4. Fallback dengan mode 'no-cors'
  try {
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: requestBody
    });

    return {
      success: true,
      mode: 'no-cors',
      message: 'Data berhasil diteruskan ke Google Spreadsheet (no-cors)'
    };
  } catch (errFallback: any) {
    console.error('Gagal mengirim data ke Google Apps Script:', errFallback);
    return {
      success: false,
      message: `Gagal menghubungkan ke Google Sheets: ${errFallback?.message || 'Koneksi terputus'}`
    };
  }
}

/**
 * Membersihkan duplikasi produk berdasarkan ID unik agar tidak ada duplikat key di React
 */
export function deduplicateProducts(products: any[]): any[] {
  if (!Array.isArray(products)) return [];
  const seen = new Set<string>();
  const cleaned: any[] = [];

  for (const p of products) {
    if (!p) continue;
    const rawId = p.ID ? String(p.ID).trim() : '';
    // Jika tidak ada ID, buat ID fallback unik
    const id = rawId || `P-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (!seen.has(id)) {
      seen.add(id);
      cleaned.push({
        ...p,
        ID: id
      });
    }
  }
  return cleaned;
}

/**
 * Membersihkan duplikasi user berdasarkan ID atau Kode/NoWA
 */
export function deduplicateUsers(users: any[]): any[] {
  if (!Array.isArray(users)) return [];
  const seenId = new Set<string>();
  const cleaned: any[] = [];

  for (const u of users) {
    if (!u) continue;
    const id = u.ID ? String(u.ID).trim() : `U-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (!seenId.has(id)) {
      seenId.add(id);
      cleaned.push({
        ...u,
        ID: id
      });
    }
  }
  return cleaned;
}

/**
 * Mengambil seluruh data dari Google Spreadsheet (GET)
 * Menggunakan server proxy /api/gas-fetch untuk melewati kendala CORS pada browser/perangkat baru.
 */
export async function fetchAllDataFromGas(gasUrl?: string): Promise<GasResponse> {
  const effectiveUrl = getActiveGasUrl(gasUrl);
  if (!effectiveUrl) {
    return { success: false, message: 'URL Web App belum terkonfigurasi. Buka pengaturan untuk menyetel URL.' };
  }

  const cleanUrl = effectiveUrl.trim();

  // 1. Coba melalui backend /api/gas-fetch (bebas kendala CORS di semua browser & perangkat)
  try {
    const proxyRes = await fetch(`/api/gas-fetch?url=${encodeURIComponent(cleanUrl)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && (data.users || data.products || data.orders || data.success)) {
        return {
          success: true,
          message: 'Data berhasil ditarik dari Google Spreadsheet!',
          data: {
            ...data,
            products: deduplicateProducts(data.products || []),
            users: deduplicateUsers(data.users || [])
          }
        };
      }
      if (data.success === false) {
        return {
          success: false,
          message: data.message || 'Gagal memproses data dari Google Spreadsheet'
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy fetch GAS gagal, mencoba fetch langsung...', proxyErr);
  }

  // 2. Direct fetch fallback
  const fetchUrl = cleanUrl.includes('?')
    ? `${cleanUrl}&action=fetchAllData&_t=${Date.now()}`
    : `${cleanUrl}?action=fetchAllData&_t=${Date.now()}`;

  try {
    const res = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Google Sheets merespon status ${res.status}: ${res.statusText}. Pastikan Deployment disetel ke 'Anyone' (Siapa Saja).`
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: 'Data berhasil ditarik dari Google Spreadsheet!',
      data: {
        ...data,
        products: deduplicateProducts(data.products || []),
        users: deduplicateUsers(data.users || [])
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menarik data dari Google Sheets: ${err?.message || 'Periksa izin deployment Web App'}. Pastikan akses di Apps Script diatur ke 'Anyone (Siapa saja)'.`
    };
  }
}

/**
 * Mengirimkan seluruh database lokal (Users, Products, Orders, Expenses, StoreData)
 * langsung ke Google Spreadsheet sekaligus
 */
export async function pushAllDatabaseToGas(
  gasUrl: string | undefined,
  fullData: {
    users: any[];
    products: any[];
    orders: any[];
    expenses: any[];
    storeData: any;
  }
): Promise<GasResponse> {
  const effectiveUrl = getActiveGasUrl(gasUrl);
  if (!effectiveUrl) {
    return { success: false, message: 'URL Web App belum terkonfigurasi' };
  }

  return sendGasAction(effectiveUrl, 'pushAllDatabase', { fullData });
}

/**
 * Sinkronisasi Pesanan Baru ke Google Spreadsheet
 */
export async function syncGasNewOrder(gasUrl: string | undefined, order: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'newOrder', { order });
}

/**
 * Sinkronisasi Perubahan Status Produksi Pesanan
 */
export async function syncGasUpdateOrderStatus(
  gasUrl: string | undefined,
  orderId: string,
  status: string,
  noCustomer?: string,
  orderDetailText?: string
): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'updateOrderStatus', {
    orderId,
    status,
    noCustomer,
    orderDetailText
  });
}

/**
 * Sinkronisasi Perubahan Status Pembayaran Pesanan
 */
export async function syncGasUpdateOrderBayar(
  gasUrl: string | undefined,
  orderId: string,
  statusBayar: string
): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'updateOrderBayar', { orderId, statusBayar });
}

/**
 * Sinkronisasi Penghapusan Pesanan
 */
export async function syncGasDeleteOrder(gasUrl: string | undefined, orderId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteOrder', { orderId });
}

/**
 * Sinkronisasi Produk Baru / Edit Produk
 */
export async function syncGasProduct(gasUrl: string | undefined, product: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'saveProduct', { product });
}

/**
 * Sinkronisasi Hapus Produk
 */
export async function syncGasDeleteProduct(gasUrl: string | undefined, productId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteProduct', { productId });
}

/**
 * Sinkronisasi Customer Baru
 */
export async function syncGasNewCustomer(gasUrl: string | undefined, user: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'newCustomer', { user });
}

/**
 * Sinkronisasi Pengeluaran Baru
 */
export async function syncGasExpense(gasUrl: string | undefined, expense: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'newExpense', { expense });
}

/**
 * Sinkronisasi Hapus Pengeluaran
 */
export async function syncGasDeleteExpense(gasUrl: string | undefined, expenseId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteExpense', { expenseId });
}

/**
 * Sinkronisasi Pengaturan Profil Toko
 */
export async function syncGasStoreData(gasUrl: string | undefined, storeData: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'updateStoreData', { storeData });
}
