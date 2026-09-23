// =================================================================
// ALINEA DESAIN - GOOGLE APPS SCRIPT (Code.gs)
// Versi 5.1: Sinkronisasi Database via SPREADSHEET_ID atau Active Sheet
// =================================================================

// Konfigurasi Utama Sistem
const CONFIG = {
  // Masukkan SPREADSHEET_ID Google Sheets Anda di sini
  // Didapat dari URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  // Contoh: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  // Jika script dibuat langsung di dalam spreadsheet (Extensions > Apps Script),
  // Anda dapat mengisinya atau mengosongkannya ("") untuk otomatis memakai Active Spreadsheet.
  SPREADSHEET_ID: "1kxoXXgoB_eq1HiWbTbxZ1qzodvQs3ZdlAPqvzl5Jmqc",

  // Konfigurasi Gateway WhatsApp (Fonnte, Fonte, Flowkirim, dll)
  WA_API_KEY: "9JPQEQhViYsp7Q6njJQv", 
  WA_URL: "https://api.fonnte.com/send",

  // URL Deployment Web App Aktif (Terhubung ke aplikasi)
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycby7KyaG5TOrNK_6QwPuhNMe-VW_7dGuluKehrY1L68fmOXpbLrLttO4Q85S-PmVAhf4/exec"
};

// Kompatibilitas konstanta
const WA_API_KEY = CONFIG.WA_API_KEY; 
const WA_URL = CONFIG.WA_URL; 

// Helper sentral untuk menghubungkan ke Google Spreadsheet via SPREADSHEET_ID atau Active
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && typeof CONFIG.SPREADSHEET_ID === 'string' && CONFIG.SPREADSHEET_ID.trim() !== "" && CONFIG.SPREADSHEET_ID !== "MASUKKAN_SPREADSHEET_ID_DISINI") {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
    } catch (err) {
      Logger.log("Peringatan: Gagal membuka Spreadsheet ID ('" + CONFIG.SPREADSHEET_ID + "'): " + err.message + ". Menggunakan active spreadsheet.");
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  // Dukungan Endpoint API JSON untuk Sync Now dari Aplikasi Web Eksternal
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    let result = {};

    if (action === 'fetchAllData') {
      result = fetchAllData();
    } else if (action === 'ping') {
      result = { status: 'ok', timestamp: new Date().toISOString(), message: 'Google Apps Script Web App Terhubung!' };
    } else if (action === 'addOrder' && e.parameter.data) {
      try {
        result = addOrder(JSON.parse(e.parameter.data));
      } catch (err) {
        result = { success: false, error: err.toString() };
      }
    } else {
      result = { error: 'Aksi tidak dikenal' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Tampilan Antarmuka Aplikasi Web untuk Browser Pengguna
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Alinea Desain - Percetakan & Digital Printing')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function doPost(e) {
  try {
    const contents = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(contents);
    const action = data.action || (e && e.parameter && e.parameter.action);

    let result = { success: false, message: 'Invalid action: ' + action };

    if (action === 'fetchAllData') {
      result = fetchAllData();
    } else if (action === 'ping') {
      result = { status: 'ok', timestamp: new Date().toISOString(), message: 'Connected' };
    } else if (action === 'addOrder') {
      result = addOrder(data.order || data);
    } else if (action === 'updateOrderStatus') {
      result = updateOrderStatus(data.orderId, data.status, data.noCustomer, data.orderDetailText);
    } else if (action === 'updateOrderBayar') {
      result = updateOrderBayar(data.orderId, data.statusBayar);
    } else if (action === 'deleteOrder') {
      result = deleteOrder(data.id || data.orderId);
    } else if (action === 'registerCustomer' || action === 'addUser') {
      result = registerCustomer(data.user || data);
    } else if (action === 'updateCustomerProfile') {
      result = updateCustomerProfile(data.user || data);
    } else if (action === 'updateAdminProfile') {
      result = updateAdminProfile(data.admin || data);
    } else if (action === 'addProduct') {
      result = addProduct(data.product || data);
    } else if (action === 'deleteProduct') {
      result = deleteProduct(data.id || data.productId);
    } else if (action === 'addExpense') {
      result = addExpense(data.expense || data);
    } else if (action === 'deleteExpense') {
      result = deleteExpense(data.id || data.expenseId);
    } else if (action === 'saveAllStoreData') {
      result = saveAllStoreData(data.storeData || data);
    } else if (action === 'syncFullDatabase') {
      result = syncFullDatabase(data.database || data);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Setup pertama kali database spreadsheet (Jalankan sekali dari menu Run di Apps Script)
function setupDatabase() {
  const ss = getSpreadsheet();
  const sheets = {
    'Users': ['ID', 'Role', 'KodeKhusus', 'Nama', 'NoWA', 'Alamat', 'Password', 'Email', 'TglDaftar'],
    'Products': ['ID', 'Nama', 'Kategori', 'Harga', 'Deskripsi', 'Thumbnail', 'Terjual', 'HargaDesain', 'HargaCutting', 'HargaLaminating'],
    'Orders': ['ID', 'Tgl', 'KodeCustomer', 'NamaCustomer', 'NoCustomer', 'IDProduk', 'NamaProduk', 'Kategori', 'Qty', 'Panjang', 'Lebar', 'Finishing', 'JasaCutting', 'JasaLaminating', 'JasaDesain', 'TotalHarga', 'StatusBayar', 'StatusOrder', 'DP', 'Sisa Tagihan', 'Catatan'],
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
          const reqClean = String(req).toLowerCase().replace(/[^a-z0-9]/g, '');
          const hasCol = headers.some(function(h) {
            return String(h).toLowerCase().replace(/[^a-z0-9]/g, '') === reqClean;
          });
          if (!hasCol) {
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
      '085815950700', 
      'Klaten', 
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
    storeSheet.appendRow(['tagline', 'Solusi Desain & Cetak Anda']);
    storeSheet.appendRow(['logo_url', '']);
    storeSheet.appendRow(['running_text', 'Selamat datang di Alinea Desain! Dapatkan promo cetak kilat MMT & stiker presisi, konsultasi desain ramah, dan diskon instansi/kampus.']);
    storeSheet.appendRow(['running_text_speed', '22']);
    storeSheet.appendRow(['alamat', 'Jl K.A Perwito Teluk, RT.01/RW.03, Ngreden, Kec. Wonosari, Kabupaten Klaten, Jawa Tengah 57473']);
    storeSheet.appendRow(['kontak', '085815950700']);
    storeSheet.appendRow(['rekening', 'CIMB Niaga 763568966600 a.n Muhammad Rosyid Ridlo']);
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
  const ss = getSpreadsheet();
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
    const ss = getSpreadsheet();
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
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Users');
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName('Users');
    }

    // Mendukung properti PascalCase maupun camelCase
    const nama = data.Nama || data.nama || data.Name || data.name || 'Customer';
    const noWA = String(data.NoWA || data.noWA || data.nowa || data.Phone || data.phone || '').trim();
    const cleanWA = noWA.replace(/[^0-9]/g, '');
    const kode = data.KodeKhusus || data.kode || data.kodeKhusus || generateRandomCode();
    const id = data.ID || data.id || ('C' + new Date().getTime());
    const alamat = data.Alamat || data.alamat || 'Yogyakarta';
    const password = data.Password || data.password || 'cust123';
    const role = data.Role || data.role || 'customer';
    const cleanName = String(nama).toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultEmail = (cleanName || 'cust') + '@gmail.com';
    const email = data.Email || data.email || defaultEmail;
    const now = data.TglDaftar || data.tglDaftar || new Date().toISOString();

    // Periksa apakah customer sudah ada di sheet Users berdasarkan ID, NoWA, Kode, atau Email
    const existingData = sheet.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < existingData.length; i++) {
      const rowId = String(existingData[i][0] || '');
      const rowKode = String(existingData[i][2] || '');
      const rowWA = String(existingData[i][4] || '').replace(/[^0-9]/g, '');
      const rowEmail = String(existingData[i][7] || '').toLowerCase().trim();

      if (
        (rowId && rowId === String(id)) ||
        (cleanWA && rowWA && (rowWA === cleanWA || rowWA.endsWith(cleanWA) || cleanWA.endsWith(rowWA))) ||
        (kode && rowKode && rowKode === String(kode)) ||
        (email && rowEmail && rowEmail === email.toLowerCase().trim())
      ) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > 0) {
      // Perbarui baris customer yang sudah terdaftar
      sheet.getRange(foundRow, 4).setValue(nama);
      if (noWA) sheet.getRange(foundRow, 5).setValue(noWA);
      if (alamat) sheet.getRange(foundRow, 6).setValue(alamat);
      if (password && password !== 'cust123') sheet.getRange(foundRow, 7).setValue(password);
      if (email) sheet.getRange(foundRow, 8).setValue(email);
    } else {
      // Simpan customer baru ke sheet Users
      sheet.appendRow([
        id,
        role,
        kode,
        nama,
        noWA,
        alamat,
        password,
        email,
        now
      ]);
    }

    const newUser = {
      ID: id,
      Role: role,
      KodeKhusus: kode,
      Nama: nama,
      NoWA: noWA,
      Alamat: alamat,
      Password: password,
      Email: email,
      TglDaftar: now
    };

    return { success: true, kode: kode, user: newUser };
  } catch (err) {
    Logger.log("Error registerCustomer: " + err.message);
    return { success: false, message: err.toString() };
  }
}

// Input Order Baru (Customer & Admin Kasir)
function addOrder(data) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Orders');
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName('Orders');
    }

    const id = data.ID || data.id || ('ORD' + new Date().getTime());
    const tgl = data.Tgl || data.tgl || new Date().toISOString();

    const kodeCustomer   = data.KodeCustomer || data.kodeCustomer || data.kode || '-';
    const namaCustomer   = data.NamaCustomer || data.namaCustomer || data.nama || 'Customer';
    const noCustomer     = data.NoCustomer || data.noCustomer || data.nowa || data.NoWA || '-';
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
    const dp             = Number(data.DP !== undefined && data.DP !== null ? data.DP : (data.dp !== undefined ? data.dp : (data.NominalDP || 0)));

    let sisaTagihan = 0;
    if (data['Sisa Tagihan'] !== undefined && data['Sisa Tagihan'] !== null && data['Sisa Tagihan'] !== '') {
      sisaTagihan = Number(data['Sisa Tagihan']);
    } else if (data.SisaTagihan !== undefined && data.SisaTagihan !== null && data.SisaTagihan !== '') {
      sisaTagihan = Number(data.SisaTagihan);
    } else if (data.sisaTagihan !== undefined && data.sisaTagihan !== null && data.sisaTagihan !== '') {
      sisaTagihan = Number(data.sisaTagihan);
    } else {
      sisaTagihan = Math.max(0, totalHarga - dp);
    }

    const statusBayar    = data.StatusBayar || data.statusBayar || (dp >= totalHarga && totalHarga > 0 ? 'Lunas' : (dp > 0 ? 'DP' : 'Belum Lunas'));
    const statusOrder    = data.StatusOrder || data.statusOrder || 'Order Masuk';
    const catatan        = data.Catatan || data.catatan || '';

    // Dapatkan header sheet Orders saat ini
    const lastCol = sheet.getLastColumn();
    let headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

    // Periksa apakah kolom 'Sisa Tagihan' sudah ada di header
    let hasSisaCol = false;
    for (let i = 0; i < headers.length; i++) {
      const cleanH = String(headers[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanH === 'sisatagihan' || cleanH === 'sisa') {
        hasSisaCol = true;
        break;
      }
    }

    // Jika kolom Sisa Tagihan belum ada di Sheet Orders pengguna, tambahkan kolom otomatis
    if (!hasSisaCol) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn())
        .setValue('Sisa Tagihan')
        .setFontWeight("bold")
        .setBackground("#0d9488")
        .setFontColor("#ffffff");
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // Mapping dinamis nilai kolom agar tepat sesuai urutan header pada spreadsheet pengguna
    const colMap = {
      'id': id,
      'tgl': tgl,
      'tanggal': tgl,
      'kodecustomer': kodeCustomer,
      'namacustomer': namaCustomer,
      'nocustomer': noCustomer,
      'nowa': noCustomer,
      'idproduk': idProduk,
      'namaproduk': namaProduk,
      'kategori': kategori,
      'qty': qty,
      'jumlah': qty,
      'panjang': panjang,
      'lebar': lebar,
      'finishing': finishing,
      'jasacutting': jasaCutting,
      'jasalaminating': jasaLaminating,
      'jasadesain': jasaDesain,
      'totalharga': totalHarga,
      'total': totalHarga,
      'statusbayar': statusBayar,
      'statusorder': statusOrder,
      'dp': dp,
      'nominaldp': dp,
      'uangmuka': dp,
      'sisatagihan': sisaTagihan,
      'sisa': sisaTagihan,
      'catatan': catatan,
      'keterangan': catatan
    };

    const rowToAppend = headers.map(function(h) {
      const key = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (colMap.hasOwnProperty(key)) {
        return colMap[key];
      }
      return '';
    });

    sheet.appendRow(rowToAppend);

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

    // Simpan customer baru otomatis ke Sheet Users jika belum terdaftar
    try {
      if (noCustomer && noCustomer !== '-' && namaCustomer && namaCustomer !== 'Customer') {
        const userSheet = ss.getSheetByName('Users');
        if (userSheet) {
          const uRows = userSheet.getDataRange().getValues();
          const cleanCustWA = String(noCustomer).replace(/[^0-9]/g, '');
          let userExists = false;
          for (let i = 1; i < uRows.length; i++) {
            const rowWA = String(uRows[i][4] || '').replace(/[^0-9]/g, '');
            if (cleanCustWA && rowWA && (rowWA === cleanCustWA || rowWA.endsWith(cleanCustWA) || cleanCustWA.endsWith(rowWA))) {
              userExists = true;
              break;
            }
          }
          if (!userExists) {
            const newCustId = 'C' + new Date().getTime();
            const newCustKode = (kodeCustomer && kodeCustomer !== '-') ? kodeCustomer : generateRandomCode();
            const cleanCustName = String(namaCustomer).toLowerCase().replace(/[^a-z0-9]/g, '');
            const custEmail = (cleanCustName || 'cust') + '@gmail.com';
            userSheet.appendRow([
              newCustId,
              'customer',
              newCustKode,
              namaCustomer,
              noCustomer,
              'Klaten',
              'cust123',
              custEmail,
              new Date().toISOString()
            ]);
          }
        }
      }
    } catch (uErr) {
      Logger.log("Auto-save user in addOrder error: " + uErr.message);
    }

    // Kirim notifikasi WhatsApp otomatis ke Customer jika nomor WA ada (menggunakan CONFIG.WA_API_KEY)
    try {
      if (noCustomer && noCustomer !== '-' && String(noCustomer).length >= 7) {
        const waMsg = "Halo Kak *" + (namaCustomer || 'Pelanggan') + "*, pesanan Anda di *Alinea Desain* telah berhasil dicatat! 📋\n\n" +
          "• *No. Pesanan:* " + id + "\n" +
          "• *Produk:* " + (namaProduk || 'Produk Cetak') + " (" + qty + "x)\n" +
          "• *Total Biaya:* Rp " + Number(totalHarga).toLocaleString('id-ID') + "\n" +
          "• *Status Bayar:* " + statusBayar + (dp > 0 ? " (DP: Rp " + Number(dp).toLocaleString('id-ID') + ")" : "") + "\n" +
          "• *Status Produksi:* " + (statusOrder || 'Order Masuk') + "\n\n" +
          "Pesanan Anda segera kami proses dengan rapi & presisi. Terima kasih! 🙏";
        sendWA(noCustomer, waMsg);
      }
    } catch (waErr) {
      Logger.log("Auto-WA new order: " + waErr.message);
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
    const sheet = getSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Sheet Orders tidak ditemukan' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, 18).setValue(status);
        if (noCustomer && noCustomer !== '-') {
          if (status === 'Selesai') {
            sendWA(noCustomer, "Halo Kak, pesanan Anda di *Alinea Desain* (*" + orderId + "*) telah *SELESAI* dan siap diambil/dikirim.\n\nDetail:\n" + (orderDetailText || '') + "\n\nTerima kasih telah mempercayakan cetakan Anda kepada kami! 🙏");
          } else if (status === 'Siap Diambil') {
            sendWA(noCustomer, "Halo Kak, pesanan Anda di *Alinea Desain* (*" + orderId + "*) sudah *SIAP DIAMBIL* di toko kami.\n\nAlamat: Jl K.A Perwito Teluk, RT.01/RW.03, Ngreden, Wonosari, Klaten.\nTerima kasih! 🙏");
          }
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
    const sheet = getSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: false };
    const headers = data[0];
    let bayarColIndex = -1;
    let sisaColIndex = -1;
    for (let h = 0; h < headers.length; h++) {
      const cleanH = String(headers[h]).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanH === 'statusbayar' || cleanH === 'bayar') bayarColIndex = h + 1;
      if (cleanH === 'sisatagihan' || cleanH === 'sisa') sisaColIndex = h + 1;
    }
    if (bayarColIndex === -1) bayarColIndex = 17; // Fallback kolom 17

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, bayarColIndex).setValue(statusBayar);
        // Jika status Lunas, otomatis update Sisa Tagihan menjadi 0
        if (statusBayar === 'Lunas' && sisaColIndex > 0) {
          sheet.getRange(i + 1, sisaColIndex).setValue(0);
        }
        return { success: true };
      }
    }
    return { success: false, message: 'Pesanan tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Hapus Pesanan
function deleteOrder(orderId) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Pesanan tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Sinkronisasi Seluruh Database (Orders, Products, Users, Expenses, StoreData)
function syncFullDatabase(data) {
  try {
    const ss = getSpreadsheet();
    setupDatabase();

    // 1. Simpan Orders
    if (data.orders && Array.isArray(data.orders)) {
      const ordSheet = ss.getSheetByName('Orders');
      if (ordSheet) {
        const lastCol = ordSheet.getLastColumn();
        let headers = lastCol > 0 ? ordSheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
        let hasSisa = headers.some(function(h) {
          const c = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
          return c === 'sisatagihan' || c === 'sisa';
        });
        if (!hasSisa) {
          ordSheet.insertColumnAfter(ordSheet.getLastColumn());
          ordSheet.getRange(1, ordSheet.getLastColumn())
            .setValue('Sisa Tagihan')
            .setFontWeight("bold")
            .setBackground("#0d9488")
            .setFontColor("#ffffff");
          headers = ordSheet.getRange(1, 1, 1, ordSheet.getLastColumn()).getValues()[0];
        }

        const existingData = ordSheet.getDataRange().getValues();
        const existingIds = {};
        for (let i = 1; i < existingData.length; i++) {
          existingIds[String(existingData[i][0])] = i + 1;
        }

        data.orders.forEach(function(ord) {
          const ordId = String(ord.ID);
          if (!existingIds[ordId]) {
            const tot = Number(ord.TotalHarga || 0);
            const dpVal = Number(ord.DP !== undefined && ord.DP !== null ? ord.DP : (ord.NominalDP || 0));
            const sisaVal = ord.SisaTagihan !== undefined && ord.SisaTagihan !== null ? Number(ord.SisaTagihan) : Math.max(0, tot - dpVal);

            const colMap = {
              'id': ord.ID,
              'tgl': ord.Tgl || new Date().toISOString(),
              'tanggal': ord.Tgl || new Date().toISOString(),
              'kodecustomer': ord.KodeCustomer || '-',
              'namacustomer': ord.NamaCustomer || 'Customer',
              'nocustomer': ord.NoCustomer || '-',
              'nowa': ord.NoCustomer || '-',
              'idproduk': ord.IDProduk || '-',
              'namaproduk': ord.NamaProduk || '-',
              'kategori': ord.Kategori || 'satuan',
              'qty': Number(ord.Qty || 1),
              'jumlah': Number(ord.Qty || 1),
              'panjang': Number(ord.Panjang || 0),
              'lebar': Number(ord.Lebar || 0),
              'finishing': ord.Finishing || '-',
              'jasacutting': Number(ord.JasaCutting || 0),
              'jasalaminating': Number(ord.JasaLaminating || 0),
              'jasadesain': Number(ord.JasaDesain || 0),
              'totalharga': tot,
              'total': tot,
              'statusbayar': ord.StatusBayar || 'Belum Lunas',
              'statusorder': ord.StatusOrder || 'Order Masuk',
              'dp': dpVal,
              'nominaldp': dpVal,
              'sisatagihan': sisaVal,
              'sisa': sisaVal,
              'catatan': ord.Catatan || '',
              'keterangan': ord.Catatan || ''
            };

            const row = headers.map(function(h) {
              const k = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
              return colMap.hasOwnProperty(k) ? colMap[k] : '';
            });

            ordSheet.appendRow(row);
            existingIds[ordId] = true;
          }
        });
      }
    }

    // 2. Simpan Users
    if (data.users && Array.isArray(data.users)) {
      const userSheet = ss.getSheetByName('Users');
      if (userSheet) {
        const existingUsers = userSheet.getDataRange().getValues();
        const userIds = {};
        for (let i = 1; i < existingUsers.length; i++) {
          userIds[String(existingUsers[i][0])] = true;
        }
        data.users.forEach(function(u) {
          const uId = String(u.ID);
          if (!userIds[uId]) {
            userSheet.appendRow([
              u.ID, u.Role || 'customer', u.KodeKhusus || '-',
              u.Nama, u.NoWA, u.Alamat || '', u.Password, u.Email || '',
              u.TglDaftar || new Date().toISOString()
            ]);
            userIds[uId] = true;
          }
        });
      }
    }

    // 3. Simpan Products
    if (data.products && Array.isArray(data.products)) {
      const prodSheet = ss.getSheetByName('Products');
      if (prodSheet) {
        const existingProds = prodSheet.getDataRange().getValues();
        const prodIds = {};
        for (let i = 1; i < existingProds.length; i++) {
          prodIds[String(existingProds[i][0])] = true;
        }
        data.products.forEach(function(p) {
          const pId = String(p.ID);
          if (!prodIds[pId]) {
            prodSheet.appendRow([
              p.ID, p.Nama, p.Kategori, Number(p.Harga) || 0,
              p.Deskripsi || '', p.Thumbnail || '', Number(p.Terjual) || 0,
              Number(p.HargaDesain) || 0, Number(p.HargaCutting) || 0, Number(p.HargaLaminating) || 0
            ]);
            prodIds[pId] = true;
          }
        });
      }
    }

    // 4. Simpan Expenses
    if (data.expenses && Array.isArray(data.expenses)) {
      const expSheet = ss.getSheetByName('Expenses');
      if (expSheet) {
        const existingExps = expSheet.getDataRange().getValues();
        const expIds = {};
        for (let i = 1; i < existingExps.length; i++) {
          expIds[String(existingExps[i][0])] = true;
        }
        data.expenses.forEach(function(ex) {
          const exId = String(ex.ID);
          if (!expIds[exId]) {
            expSheet.appendRow([
              ex.ID, ex.Tgl || new Date().toISOString().split('T')[0],
              Number(ex.Total || 0), ex.Toko || '', ex.Detail || '', ex.NotaUrl || ''
            ]);
            expIds[exId] = true;
          }
        });
      }
    }

    // 5. Simpan StoreData
    if (data.storeData) {
      saveAllStoreData(data.storeData);
    }

    return { success: true, message: 'Seluruh database berhasil disinkronkan ke Spreadsheet!' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Tambah Produk Baru
function addProduct(data) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Products');
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
    const sheet = getSpreadsheet().getSheetByName('Products');
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
    const ss = getSpreadsheet();
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
    const sheet = getSpreadsheet().getSheetByName('Expenses');
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
    const sheet = getSpreadsheet().getSheetByName('Users');
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
    const sheet = getSpreadsheet().getSheetByName('Users');
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
    const sheet = getSpreadsheet().getSheetByName('StoreData');
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

// Ambil Konfigurasi WhatsApp Dinamis dari Sheet StoreData
function getWhatsAppConfig() {
  const defaults = {
    apiKey: WA_API_KEY,
    url: WA_URL,
    provider: 'fonnte',
    senderNumber: '',
    autoOrder: true,
    autoStatus: true
  };

  try {
    const sheet = getSpreadsheet().getSheetByName('StoreData');
    if (!sheet) return defaults;
    const data = sheet.getDataRange().getValues();
    data.forEach(row => {
      const key = String(row[0]).trim();
      const val = row[1];
      if (key === 'wa_api_key' && val) defaults.apiKey = String(val).trim();
      if (key === 'wa_api_url' && val) defaults.url = String(val).trim();
      if (key === 'wa_provider' && val) defaults.provider = String(val).trim();
      if (key === 'wa_sender_number' && val) defaults.senderNumber = String(val).trim();
      if (key === 'wa_auto_order') defaults.autoOrder = val === true || val === 'true';
      if (key === 'wa_auto_status') defaults.autoStatus = val === true || val === 'true';
    });
  } catch (e) {
    Logger.log("Error getWhatsAppConfig: " + e.message);
  }

  return defaults;
}

// Pengiriman Notifikasi WhatsApp (Fonnte / Fonte / Flowkirim / Starsender / Custom)
function sendWA(phone, message) {
  try {
    const cfg = getWhatsAppConfig();
    const token = cfg.apiKey;
    if (!token || token === "MASUKKAN_API_KEY_ANDA_DISINI") return;

    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const endpoint = cfg.url || 'https://api.fonnte.com/send';
    const payload = {
      target: cleanPhone,
      message: message,
      countryCode: '62'
    };

    const options = {
      'method': 'post',
      'headers': {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    const resp = UrlFetchApp.fetch(endpoint, options);
    Logger.log("Kirim WA (" + cleanPhone + ") respon: " + resp.getContentText());
    return { success: true, response: resp.getContentText() };
  } catch (e) {
    Logger.log("Gagal kirim WhatsApp: " + e.message);
    return { success: false, message: e.message };
  }
}

// Fungsi pembantu untuk dipanggil dari antarmuka pengguna
function sendWhatsAppNotification(phone, message) {
  return sendWA(phone, message);
}
