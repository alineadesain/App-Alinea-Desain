// =================================================================
// ALINEA DESAIN - GOOGLE APPS SCRIPT (Code.gs)
// Versi 5.0: Sinkronisasi Penuh Database, Orders, Expenses & Toko
// =================================================================

// Konfigurasi API WhatsApp (Fonnte / Fonte / Flowkirim / dsb)
// Biarkan kosong atau default jika belum menggunakan gateway WhatsApp
const WA_API_KEY = "MASUKKAN_API_KEY_ANDA_DISINI"; 
const WA_URL = "https://api.fonnte.com/send"; 

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Alinea Desain - Percetakan & Digital Printing')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

// Setup pertama kali database spreadsheet (Jalankan sekali dari menu Run di Apps Script)
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    'Users': ['ID', 'Role', 'KodeKhusus', 'Nama', 'NoWA', 'Alamat', 'Password', 'Email', 'TglDaftar'],
    'Products': ['ID', 'Nama', 'Kategori', 'Harga', 'Deskripsi', 'Thumbnail', 'Terjual', 'HargaDesain', 'HargaCutting', 'HargaLaminating'],
    'Orders': ['ID', 'Tgl', 'KodeCustomer', 'NamaCustomer', 'NoCustomer', 'IDProduk', 'NamaProduk', 'Kategori', 'Qty', 'Panjang', 'Lebar', 'Finishing', 'JasaCutting', 'JasaLaminating', 'JasaDesain', 'TotalHarga', 'StatusBayar', 'StatusOrder', 'DP', 'Catatan'],
    'Expenses': ['ID', 'Tgl', 'Total', 'Toko', 'Detail', 'NotaUrl'],
    'StoreData': ['Key', 'Value']
  };

  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length)
        .setFontWeight("bold")
        .setBackground("#0d9488")
        .setFontColor("#ffffff");
    } else {
      const lastCol = sheet.getLastColumn();
      if (lastCol > 0) {
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const requiredHeaders = sheets[sheetName];
        requiredHeaders.forEach(req => {
          if (!headers.includes(req)) {
            sheet.insertColumnAfter(sheet.getLastColumn());
            sheet.getRange(1, sheet.getLastColumn())
              .setValue(req)
              .setFontWeight("bold");
          }
        });
      }
    }
  }

  // Data Awal Admin jika Users masih kosong
  let userSheet = ss.getSheetByName('Users');
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow([
      'U1', 
      'admin', 
      '-', 
      'Admin Alinea', 
      '081234567890', 
      'Yogyakarta', 
      'admin123', 
      'admin@alineadesain.com', 
      new Date().toISOString()
    ]);
  }
  
  // Data Awal Produk jika Products masih kosong
  let prodSheet = ss.getSheetByName('Products');
  if (prodSheet.getLastRow() === 1) {
    prodSheet.appendRow([
      'P1', 'Banner MMT 280gram (Outdoor/Indoor)', 'meteran', 21000, 
      'Bahan MMT standar kuat untuk spanduk toko, baliho, event.', 
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80', 
      120, 15000, 5000, 0
    ]);
    prodSheet.appendRow([
      'P2', 'Banner Korea MMT 440gram Tebal', 'meteran', 38000, 
      'Bahan tebal premium tidak mudah robek, warna pekat tahan lama.', 
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=80', 
      75, 15000, 5000, 0
    ]);
    prodSheet.appendRow([
      'P3', 'Sticker Vinyl A3+ Kiss Cut', 'satuan', 12000, 
      'Sticker anti air dengan cutting presisi untuk kemasan produk UMKM.', 
      'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&auto=format&fit=crop&q=80', 
      90, 15000, 3000, 4000
    ]);
    prodSheet.appendRow([
      'P4', 'Kartu Nama Eksklusif (1 Box / 100 Pcs)', 'satuan', 35000, 
      'Cetak 1 box isi 100 lembar art carton 260gr dengan box mika.', 
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80', 
      50, 15000, 0, 7000
    ]);
  }

  // Data Awal Pengaturan Toko jika StoreData masih kosong
  let storeSheet = ss.getSheetByName('StoreData');
  if (storeSheet.getLastRow() === 1) {
    storeSheet.appendRow(['nama_toko', 'Alinea Desain']);
    storeSheet.appendRow(['tagline', 'Percetakan & Digital Printing Cepat Berkualitas']);
    storeSheet.appendRow(['logo_url', '']);
    storeSheet.appendRow(['running_text', 'Selamat datang di Alinea Desain! Dapatkan promo cetak kilat MMT & stiker presisi, konsultasi desain ramah, dan diskon instansi/kampus.']);
    storeSheet.appendRow(['running_text_speed', '22']);
    storeSheet.appendRow(['alamat', 'Jl. Prof. Dr. Sardjito No. 45, Terban, Gondokusuman, Yogyakarta']);
    storeSheet.appendRow(['kontak', '081234567890']);
    storeSheet.appendRow(['rekening', 'BCA 1234567890 a.n ALINEA DESAIN CREATIVE']);
    storeSheet.appendRow(['clients_slider', JSON.stringify([
      {"id":"c1","nama":"Universitas Gadjah Mada","logo":"https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=160&auto=format&fit=crop&q=80","keterangan":"Cetak Buku Panduan, Banner Seminar & Sertifikat KKN","kategori":"Pendidikan"},
      {"id":"c2","nama":"Universitas Diponegoro","logo":"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=160&auto=format&fit=crop&q=80","keterangan":"Backdrop Wisuda & Souvenir Dies Natalis","kategori":"Pendidikan"},
      {"id":"c3","nama":"Rubytech Digital","logo":"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80","keterangan":"Branding Booth Expo, X-Banner & ID Card","kategori":"Perusahaan"},
      {"id":"c4","nama":"J&T Express Jogja","logo":"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=160&auto=format&fit=crop&q=80","keterangan":"Sticker Thermal Label & Banner Outlet","kategori":"Logistik"}
    ])]);
  }
}

// Helper membaca data tabel dari Sheet
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

// Generate Kode Customer acak 8 digit unik
function generateRandomCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Mengambil seluruh data dari Google Spreadsheet
function fetchAllData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName('Users') || !ss.getSheetByName('Orders')) {
      setupDatabase();
    }
    return {
      users: getSheetData('Users'),
      products: getSheetData('Products'),
      orders: getSheetData('Orders'),
      expenses: getSheetData('Expenses'),
      storeData: getSheetData('StoreData')
    };
  } catch (e) {
    Logger.log("Error fetchAllData: " + e.message);
    return { users: [], products: [], orders: [], expenses: [], storeData: [] };
  }
}

// Autentikasi Login (Mendukung Login Admin & Customer)
function loginUser(identifier, password, role) {
  try {
    const users = getSheetData('Users');
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    const user = users.find(u => {
      const uName = String(u.Nama || '').trim().toLowerCase();
      const uEmail = String(u.Email || '').trim().toLowerCase();
      const uKode = String(u.KodeKhusus || '').trim();
      const matchIdentity = (uName === cleanId || uEmail === cleanId || uKode === cleanId);
      return matchIdentity && String(u.Password) === cleanPass && u.Role === role;
    });

    if (user) {
      return { success: true, user: user };
    }
    return { success: false, message: 'Nama/Email atau password salah.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Pendaftaran Akun Customer Baru
function registerCustomer(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Users');
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName('Users');
    }

    const kode = generateRandomCode();
    const id = 'C' + new Date().getTime();
    const email = data.email || (data.nama.toLowerCase().replace(/[^a-z0-9]/g, '') + '@gmail.com');
    const password = data.password || 'cust123';
    const now = new Date().toISOString();

    sheet.appendRow([
      id,
      'customer',
      kode,
      data.nama || 'Customer',
      data.noWA || '',
      data.alamat || 'Yogyakarta',
      password,
      email,
      now
    ]);

    const newUser = {
      ID: id,
      Role: 'customer',
      KodeKhusus: kode,
      Nama: data.nama || 'Customer',
      NoWA: data.noWA || '',
      Alamat: data.alamat || 'Yogyakarta',
      Password: password,
      Email: email,
      TglDaftar: now
    };

    return { success: true, kode: kode, user: newUser };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Input Order Baru (Customer & Admin Kasir)
function addOrder(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Orders');
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName('Orders');
    }

    const id = data.ID || ('ORD' + new Date().getTime());
    const tgl = data.Tgl || new Date().toISOString();

    const kodeCustomer   = data.KodeCustomer || data.kodeCustomer || '-';
    const namaCustomer   = data.NamaCustomer || data.namaCustomer || 'Customer';
    const noCustomer     = data.NoCustomer || data.noCustomer || '-';
    const idProduk       = data.IDProduk || data.idProduk || '-';
    const namaProduk     = data.NamaProduk || data.namaProduk || '-';
    const kategori       = data.Kategori || data.kategori || 'satuan';
    const qty            = Number(data.Qty || data.qty || 1);
    const panjang        = Number(data.Panjang || data.panjang || 0);
    const lebar          = Number(data.Lebar || data.lebar || 0);
    const finishing      = data.Finishing || data.finishing || '-';
    const jasaCutting    = Number(data.JasaCutting || data.jasaCutting || 0);
    const jasaLaminating = Number(data.JasaLaminating || data.jasaLaminating || 0);
    const jasaDesain     = Number(data.JasaDesain || data.jasaDesain || 0);
    const totalHarga     = Number(data.TotalHarga || data.totalHarga || 0);
    const statusBayar    = data.StatusBayar || data.statusBayar || 'Belum Lunas';
    const statusOrder    = data.StatusOrder || data.statusOrder || 'Order Masuk';
    const dp             = Number(data.DP || data.dp || 0);
    const catatan        = data.Catatan || data.catatan || '';

    sheet.appendRow([
      id, tgl, kodeCustomer, namaCustomer, noCustomer, idProduk, namaProduk,
      kategori, qty, panjang, lebar, finishing,
      jasaCutting, jasaLaminating, jasaDesain, totalHarga,
      statusBayar, statusOrder, dp, catatan
    ]);

    // Update jumlah terjual produk di Sheet Products
    try {
      const prodSheet = ss.getSheetByName('Products');
      if (prodSheet && idProduk !== '-') {
        const pRows = prodSheet.getDataRange().getValues();
        for (let i = 1; i < pRows.length; i++) {
          if (String(pRows[i][0]) === String(idProduk)) {
            const currentTerjual = Number(pRows[i][6]) || 0;
            prodSheet.getRange(i + 1, 7).setValue(currentTerjual + qty);
            break;
          }
        }
      }
    } catch (e) {
      Logger.log("Update terjual error: " + e.message);
    }

    return { success: true, id: id };
  } catch (err) {
    Logger.log("Error addOrder: " + err.message);
    return { success: false, message: err.toString() };
  }
}

// Update Status Order (Order Masuk, Proses, Siap Diambil, Selesai, Dibatalkan)
function updateOrderStatus(orderId, status, noCustomer, orderDetailText) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Sheet Orders tidak ditemukan' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, 18).setValue(status);
        if (status === 'Selesai' && noCustomer) {
          sendWA(noCustomer, `Halo, pesanan Anda di Alinea Desain (*${orderId}*) telah *SELESAI* dan siap diambil/dikirim.\n\nDetail:\n${orderDetailText || ''}\n\nTerima kasih atas kepercayaan Anda!`);
        }
        return { success: true };
      }
    }
    return { success: false, message: 'Pesanan tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Update Status Bayar (Belum Lunas, DP Terbayar, Lunas)
function updateOrderBayar(orderId, statusBayar) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, 17).setValue(statusBayar);
        return { success: true };
      }
    }
    return { success: false, message: 'Pesanan tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Tambah Produk Baru
function addProduct(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
    if (!sheet) return { success: false };
    const id = data.ID || ('P' + new Date().getTime());
    sheet.appendRow([
      id,
      data.Nama || 'Produk Baru',
      data.Kategori || 'satuan',
      Number(data.Harga) || 0,
      data.Deskripsi || '',
      data.Thumbnail || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80',
      0,
      Number(data.HargaDesain) || 0,
      Number(data.HargaCutting) || 0,
      Number(data.HargaLaminating) || 0
    ]);
    return { success: true, id: id };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Hapus Produk
function deleteProduct(id) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Produk tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Catat Pengeluaran Baru (Kas Toko)
function addExpense(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Expenses');
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName('Expenses');
    }
    const id = data.ID || ('EXP' + new Date().getTime());
    const tgl = data.Tgl || new Date().toISOString().split('T')[0];
    const total = Number(data.Total || data.total || 0);
    const toko = data.Toko || data.toko || 'Toko Bahan';
    const detail = data.Detail || data.detail || '-';
    const notaUrl = data.NotaUrl || data.notaUrl || '';

    sheet.appendRow([id, tgl, total, toko, detail, notaUrl]);
    return { success: true, id: id };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Hapus Pengeluaran
function deleteExpense(id) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Expenses');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Pengeluaran tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Update Profil Customer
function updateCustomerProfile(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) return { success: false };
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][2]) === String(data.kode) || String(rows[i][0]) === String(data.id)) {
        if (data.nama) sheet.getRange(i + 1, 4).setValue(data.nama);
        if (data.noWA) sheet.getRange(i + 1, 5).setValue(data.noWA);
        if (data.alamat) sheet.getRange(i + 1, 6).setValue(data.alamat);
        if (data.password) sheet.getRange(i + 1, 7).setValue(data.password);
        return { success: true };
      }
    }
    return { success: false, message: 'Customer tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Update Password / Profil Admin
function updateAdminProfile(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) return { success: false };
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === 'admin') {
        if (data.nama) sheet.getRange(i + 1, 4).setValue(data.nama);
        if (data.password) sheet.getRange(i + 1, 7).setValue(data.password);
        return { success: true };
      }
    }
    return { success: false, message: 'Akun Admin tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Simpan Pengaturan Toko & Logo (Key-Value)
function updateStoreData(key, value) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('StoreData');
    if (!sheet) return { success: false };
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(key)) {
        sheet.getRange(i + 1, 2).setValue(value);
        return { success: true };
      }
    }
    sheet.appendRow([key, value]);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Simpan Semua Informasi Toko Sekaligus
function saveAllStoreData(storeObj) {
  try {
    for (let k in storeObj) {
      updateStoreData(k, typeof storeObj[k] === 'object' ? JSON.stringify(storeObj[k]) : String(storeObj[k]));
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Pengiriman Notifikasi WhatsApp (Opsional Gateway)
function sendWA(phone, message) {
  if (!WA_API_KEY || WA_API_KEY === "MASUKKAN_API_KEY_ANDA_DISINI") return;
  try {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const options = {
      'method': 'post',
      'headers': { 'Authorization': WA_API_KEY },
      'payload': { 'target': cleanPhone, 'message': message },
      'muteHttpExceptions': true
    };
    UrlFetchApp.fetch(WA_URL, options);
  } catch (e) {
    Logger.log("Gagal kirim WhatsApp: " + e.message);
  }
}
