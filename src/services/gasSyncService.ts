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
 * Normalisasi status order dari spreadsheet agar tidak kembali ke default 'Order Masuk'
 * jika di spreadsheet statusnya adalah 'Proses', 'Selesai', 'Order Baru', atau status kustom lainnya.
 */
export function normalizeOrderStatus(rawStatus: any): string {
  if (rawStatus === undefined || rawStatus === null) return 'Order Masuk';
  const str = String(rawStatus).trim();
  if (!str) return 'Order Masuk';

  const lower = str.toLowerCase();
  if (lower === 'selesai' || lower === 'done' || lower === 'completed' || lower.includes('selesai') || lower === 'siap diambil') {
    return 'Selesai';
  }
  if (lower === 'proses' || lower === 'diproses' || lower === 'sedang diproses' || lower === 'pengerjaan' || lower === 'dalam pengerjaan' || lower.includes('proses')) {
    return 'Proses';
  }
  if (lower === 'order masuk' || lower === 'order baru' || lower === 'baru' || lower === 'masuk' || lower === 'pending') {
    return 'Order Masuk';
  }
  // Pertahankan status kustom yang mungkin diketik langsung di spreadsheet
  return str;
}

/**
 * Normalisasi objek Order dari Google Spreadsheet agar semua variasi nama kolom
 * (dengan spasi, huruf kecil/besar) dapat terbaca akurat tanpa reset status
 */
export function normalizeOrder(o: any): any {
  if (!o) return null;
  // Deteksi status order dari segala variasi nama kolom di sheet
  const rawStatus =
    o.StatusOrder ??
    o['Status Order'] ??
    o.statusOrder ??
    o.statusorder ??
    o.status_order ??
    o.Status ??
    o.status ??
    o['Status Pesanan'] ??
    o.StatusProduksi ??
    o['Status Pengerjaan'];

  const finalStatus = normalizeOrderStatus(rawStatus);

  // Status bayar
  const rawBayar =
    o.StatusBayar ??
    o['Status Bayar'] ??
    o.statusBayar ??
    o.statusbayar ??
    o['Status Pembayaran'] ??
    o.Bayar ??
    o.bayar;

  const total = Number(o.TotalHarga ?? o['Total Harga'] ?? o.totalHarga ?? o.total ?? 0);
  const dp = Number(o.DP ?? o['Nominal DP'] ?? o.NominalDP ?? o.nominalDP ?? o.dp ?? 0);
  const rawSisa = o['Sisa Tagihan'] ?? o.SisaTagihan ?? o.sisaTagihan ?? o.Sisa ?? o.sisa;
  const sisa =
    rawSisa !== undefined && rawSisa !== null && rawSisa !== ''
      ? Number(rawSisa)
      : Math.max(0, total - dp);

  let statusBayar = rawBayar;
  if (!statusBayar) {
    statusBayar = dp >= total && total > 0 ? 'Lunas' : dp > 0 ? 'DP' : 'Belum Lunas';
  }

  let parsedItems = o.Items ?? o.items ?? o.Rincian;
  if (typeof parsedItems === 'string') {
    try {
      const arr = JSON.parse(parsedItems);
      if (Array.isArray(arr)) parsedItems = arr;
    } catch {
      // Biarkan jika gagal parse
    }
  }

  return {
    ...o,
    ID: String(o.ID ?? o.id ?? `ORD-${Date.now()}`),
    Tgl: o.Tgl ?? o.tgl ?? o.Tanggal ?? o.tanggal ?? new Date().toISOString(),
    KodeCustomer: String(o.KodeCustomer ?? o['Kode Customer'] ?? o.kodeCustomer ?? o.Kode ?? '-'),
    NamaCustomer: String(o.NamaCustomer ?? o['Nama Customer'] ?? o.namaCustomer ?? o.Customer ?? 'Customer'),
    NoCustomer: String(o.NoCustomer ?? o['No Customer'] ?? o['No WA'] ?? o.noCustomer ?? o.nowa ?? '-'),
    IDProduk: String(o.IDProduk ?? o['ID Produk'] ?? o.idProduk ?? '-'),
    NamaProduk: String(o.NamaProduk ?? o['Nama Produk'] ?? o.namaProduk ?? o.Produk ?? 'Produk'),
    Kategori: o.Kategori ?? o.kategori ?? 'satuan',
    Qty: Number(o.Qty ?? o.qty ?? o.Jumlah ?? 1),
    Panjang: Number(o.Panjang ?? o.panjang ?? 0),
    Lebar: Number(o.Lebar ?? o.lebar ?? 0),
    Finishing: String(o.Finishing ?? o.finishing ?? '-'),
    JasaCutting: Number(o.JasaCutting ?? o['Jasa Cutting'] ?? o.Cutting ?? 0),
    JasaLaminating: Number(o.JasaLaminating ?? o['Jasa Laminating'] ?? o.Laminating ?? 0),
    JasaDesain: Number(o.JasaDesain ?? o['Jasa Desain'] ?? o.Desain ?? 0),
    JasaLain: Number(o.JasaLain ?? 0),
    NamaJasaLain: o.NamaJasaLain ? String(o.NamaJasaLain) : undefined,
    FileDesain: o.FileDesain ?? o['File Desain'] ?? o.fileDesain ?? o.DesainUrl,
    TotalHarga: total,
    DP: dp,
    NominalDP: dp,
    SisaTagihan: sisa,
    StatusBayar: statusBayar,
    StatusOrder: finalStatus,
    Catatan: o.Catatan ?? o.catatan ?? o.Keterangan ?? '',
    Items: parsedItems
  };
}

/**
 * Normalisasi dan parse StoreData dari Google Spreadsheet
 * Mengonversi array baris tabel [Key, Value] menjadi objek yang memiliki logo_url, nama_toko, dll.
 */
export function parseStoreDataObject(rawStoreData: any): Record<string, any> {
  if (!rawStoreData) return {};
  if (Array.isArray(rawStoreData)) {
    const obj: Record<string, any> = {};
    rawStoreData.forEach((row) => {
      if (!row) return;
      const k = String(row.Key || row.key || (Array.isArray(row) ? row[0] : '') || '').trim();
      const v =
        row.Value !== undefined
          ? row.Value
          : row.value !== undefined
          ? row.value
          : Array.isArray(row)
          ? row[1]
          : '';
      if (k) {
        if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
          try {
            obj[k] = JSON.parse(v);
            return;
          } catch {
            // Abaikan parse error, simpan string
          }
        }
        obj[k] = v;
      }
    });
    // Alias sinkronisasi logo
    if (obj.logo && !obj.logo_url) obj.logo_url = obj.logo;
    return obj;
  }
  if (typeof rawStoreData === 'object') {
    const copy = { ...rawStoreData };
    if (copy.logo && !copy.logo_url) copy.logo_url = copy.logo;
    return copy;
  }
  return {};
}

/**
 * Mengurutkan pesanan dengan urutan pesanan terbaru berada di paling atas
 */
export function sortOrdersLatestFirst<T extends { Tgl?: string; ID?: string; Tanggal?: string }>(orders: T[]): T[] {
  if (!Array.isArray(orders)) return [];
  return [...orders].sort((a, b) => {
    const rawA = a.Tgl || a.Tanggal || '';
    const rawB = b.Tgl || b.Tanggal || '';
    const timeA = new Date(rawA).getTime();
    const timeB = new Date(rawB).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeB - timeA; // Waktu terbaru di atas
    }
    const idA = String(a.ID || '');
    const idB = String(b.ID || '');
    return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
  });
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
        const cleanedOrders = Array.isArray(data.orders)
          ? sortOrdersLatestFirst(data.orders.map(normalizeOrder).filter(Boolean))
          : [];
        const parsedStore = parseStoreDataObject(data.storeData || data.store_data);

        return {
          success: true,
          message: 'Data berhasil ditarik dari Google Spreadsheet!',
          data: {
            ...data,
            orders: cleanedOrders,
            products: deduplicateProducts(data.products || []),
            users: deduplicateUsers(data.users || []),
            storeData: parsedStore
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
    const cleanedOrders = Array.isArray(data.orders)
      ? sortOrdersLatestFirst(data.orders.map(normalizeOrder).filter(Boolean))
      : [];
    const parsedStore = parseStoreDataObject(data.storeData || data.store_data);

    return {
      success: true,
      message: 'Data berhasil ditarik dari Google Spreadsheet!',
      data: {
        ...data,
        orders: cleanedOrders,
        products: deduplicateProducts(data.products || []),
        users: deduplicateUsers(data.users || []),
        storeData: parsedStore
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
  return sendGasAction(gasUrl, 'deleteOrder', { orderId, id: orderId });
}

/**
 * Sinkronisasi Produk Baru / Edit Produk
 */
export async function syncGasProduct(gasUrl: string | undefined, product: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'addProduct', { product });
}

/**
 * Sinkronisasi Hapus Produk
 */
export async function syncGasDeleteProduct(gasUrl: string | undefined, productId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteProduct', { productId, id: productId });
}

/**
 * Sinkronisasi Customer Baru
 */
export async function syncGasNewCustomer(gasUrl: string | undefined, user: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'registerCustomer', { user });
}

/**
 * Sinkronisasi Hapus Customer
 */
export async function syncGasDeleteUser(gasUrl: string | undefined, userId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteUser', { userId, id: userId });
}

/**
 * Sinkronisasi Pengeluaran Baru
 */
export async function syncGasExpense(gasUrl: string | undefined, expense: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'addExpense', { expense });
}

/**
 * Sinkronisasi Hapus Pengeluaran
 */
export async function syncGasDeleteExpense(gasUrl: string | undefined, expenseId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteExpense', { expenseId, id: expenseId });
}

/**
 * Sinkronisasi Pengaturan Profil Toko
 */
export async function syncGasStoreData(gasUrl: string | undefined, storeData: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'saveAllStoreData', { storeData });
}

/**
 * Sinkronisasi Identitas & Logo Toko ke Google Spreadsheet
 * Menyimpan nama_toko, tagline, dan link logo_url ke sheet StoreData
 */
export async function syncStoreBrandingToGas(
  gasUrl: string | undefined,
  branding: { nama_toko: string; tagline?: string; logo_url?: string }
): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'saveAllStoreData', {
    storeData: {
      nama_toko: branding.nama_toko,
      tagline: branding.tagline || '',
      logo_url: branding.logo_url || '',
      logo: branding.logo_url || ''
    }
  });
}

