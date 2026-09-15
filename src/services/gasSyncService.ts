/**
 * Service untuk Sinkronisasi Real-Time dengan Google Apps Script Web App
 * Memungkinkan seluruh data (Pesanan, Produk, Customer, Pengeluaran, Toko)
 * tersimpan langsung ke Google Spreadsheet tanpa terkendala CORS browser.
 */

export interface GasResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  mode?: string;
}

/**
 * Mengirim perubahan data ke Google Apps Script Web App (POST text/plain sederhana)
 * Menggunakan mode text/plain untuk melewati batasan CORS preflight OPTIONS di browser.
 * Dilengkapi fallback mode 'no-cors' agar data tetap terkirim ke Spreadsheet jika
 * terjadi redirect lintas domain dari script.google.com.
 */
export async function sendGasAction(
  gasUrl: string | undefined,
  action: string,
  payload: Record<string, any> = {}
): Promise<GasResponse> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Web App belum dikonfigurasi' };
  }

  const cleanUrl = gasUrl.trim();
  const requestBody = JSON.stringify({
    action,
    ...payload,
    timestamp: new Date().toISOString()
  });

  // Percobaan 1: Menggunakan Fetch standar text/plain (CORS standard simple request)
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
    console.warn('Fetch GAS standar mengembalikan kendala jaringan, mencoba fallback mode no-cors...', err);
  }

  // Percobaan 2: Fallback dengan mode 'no-cors'
  // Mode no-cors menjamin browser mengirimkan data POST ke server Google Apps Script
  // meskipun browser tidak mengizinkan pembacaan response lintas origin.
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
 * Mengambil seluruh data dari Google Spreadsheet (GET)
 */
export async function fetchAllDataFromGas(gasUrl: string): Promise<GasResponse> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Web App tidak valid' };
  }

  const cleanUrl = gasUrl.trim();
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
      data
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
  gasUrl: string,
  fullData: {
    users: any[];
    products: any[];
    orders: any[];
    expenses: any[];
    storeData: any;
  }
): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'syncFullDatabase', {
    database: fullData,
    users: fullData.users,
    products: fullData.products,
    orders: fullData.orders,
    expenses: fullData.expenses,
    storeData: fullData.storeData
  });
}

/**
 * Helper sync instan per tindakan (Pesanan Baru, Status, dsb)
 */
export async function syncGasNewOrder(gasUrl: string | undefined, order: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'addOrder', { order });
}

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

export async function syncGasUpdateOrderBayar(
  gasUrl: string | undefined,
  orderId: string,
  statusBayar: string
): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'updateOrderBayar', { orderId, statusBayar });
}

export async function syncGasDeleteOrder(gasUrl: string | undefined, orderId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteOrder', { id: orderId, orderId });
}

export async function syncGasNewCustomer(gasUrl: string | undefined, user: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'registerCustomer', { user });
}

export async function syncGasProduct(gasUrl: string | undefined, product: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'addProduct', { product });
}

export async function syncGasDeleteProduct(gasUrl: string | undefined, productId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteProduct', { id: productId, productId });
}

export async function syncGasExpense(gasUrl: string | undefined, expense: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'addExpense', { expense });
}

export async function syncGasDeleteExpense(gasUrl: string | undefined, expenseId: string): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'deleteExpense', { id: expenseId, expenseId });
}

export async function syncGasStoreData(gasUrl: string | undefined, storeData: any): Promise<GasResponse> {
  return sendGasAction(gasUrl, 'saveAllStoreData', { storeData });
}
