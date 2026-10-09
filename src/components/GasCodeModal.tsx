import React, { useState } from 'react';
import { X, Copy, Check, FileCode, CheckCircle2, Info, LayoutTemplate } from 'lucide-react';

interface GasCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasCodeModal: React.FC<GasCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'indexhtml' | 'panduan'>('codegs');
  const [copiedCodeGs, setCopiedCodeGs] = useState(false);
  const [copiedIndexHtml, setCopiedIndexHtml] = useState(false);

  if (!isOpen) return null;

  const codeGsContent = `// =================================================================
// ALINEA DESAIN - GOOGLE APPS SCRIPT (Code.gs)
// Versi 5.1: Sinkronisasi Database via SPREADSHEET_ID / Active
// =================================================================

const CONFIG = {
  // ID Spreadsheet Google Sheets Anda
  // (ID ada di URL: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit)
  SPREADSHEET_ID: "1kxoXXgoB_eq1HiWbTbxZ1qzodvQs3ZdlAPqvzl5Jmqc", 

  // Gateway WhatsApp Fonnte Anda
  WA_API_KEY: "9JPQEQhViYsp7Q6njJQv", 
  WA_URL: "https://api.fonnte.com/send"
};

const WA_API_KEY = CONFIG.WA_API_KEY; 
const WA_URL = CONFIG.WA_URL; 

function getSpreadsheet() {
  var id = (CONFIG && CONFIG.SPREADSHEET_ID) ? String(CONFIG.SPREADSHEET_ID).trim() : "";
  if (id && id !== "" && id.indexOf("MASUKKAN") === -1 && id.indexOf("CONTOH") === -1) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      Logger.log("Peringatan: Gagal membuka Spreadsheet ID ('" + id + "'): " + err.message + ". Menggunakan active spreadsheet.");
    }
  }
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    Logger.log("Active spreadsheet tidak tersedia: " + e.message);
  }
  throw new Error("Spreadsheet tidak dapat diakses! Pastikan SPREADSHEET_ID sudah diisi dengan ID spreadsheet Anda di CONFIG Code.gs.");
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    let result = {};
    if (action === 'fetchAllData') {
      result = fetchAllData();
    } else if (action === 'ping') {
      result = { status: 'ok', timestamp: new Date().toISOString(), message: 'Connected' };
    } else {
      result = { error: 'Unknown action' };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

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
    } else if (action === 'addOrder' || action === 'newOrder') {
      result = addOrder(data.order || data);
    } else if (action === 'updateOrderStatus') {
      result = updateOrderStatus(data.orderId, data.status, data.noCustomer, data.orderDetailText);
    } else if (action === 'updateOrderBayar') {
      result = updateOrderBayar(data.orderId, data.statusBayar);
    } else if (action === 'deleteOrder') {
      result = deleteOrder(data.id || data.orderId);
    } else if (action === 'registerCustomer' || action === 'addUser' || action === 'newCustomer') {
      result = registerCustomer(data.user || data);
    } else if (action === 'deleteUser') {
      result = deleteUser(data.id || data.userId);
    } else if (action === 'addProduct' || action === 'saveProduct') {
      result = addProduct(data.product || data);
    } else if (action === 'deleteProduct') {
      result = deleteProduct(data.id || data.productId);
    } else if (action === 'addExpense' || action === 'newExpense') {
      result = addExpense(data.expense || data);
    } else if (action === 'deleteExpense') {
      result = deleteExpense(data.id || data.expenseId);
    } else if (action === 'saveAllStoreData' || action === 'updateStoreData') {
      result = saveAllStoreData(data.storeData || data);
    } else if (action === 'syncFullDatabase' || action === 'pushAllDatabase') {
      result = syncFullDatabase(data.database || data.fullData || data);
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupDatabase() {
  const ss = getSpreadsheet();
  const sheets = {
    'Users': ['ID', 'Role', 'KodeKhusus', 'Nama', 'NoWA', 'Alamat', 'Password', 'Email', 'TglDaftar'],
    'Products': ['ID', 'Nama', 'Kategori', 'Harga', 'Deskripsi', 'Thumbnail', 'Terjual', 'HargaDesain', 'HargaCutting', 'HargaLaminating'],
    'Orders': ['ID', 'Tgl', 'KodeCustomer', 'NamaCustomer', 'NoCustomer', 'IDProduk', 'NamaProduk', 'Kategori', 'Qty', 'Panjang', 'Lebar', 'Finishing', 'JasaCutting', 'JasaLaminating', 'JasaDesain', 'TotalHarga', 'StatusBayar', 'StatusOrder', 'DP', 'Sisa Tagihan', 'Catatan'],
    'OrderItems': ['IDOrder', 'Tanggal', 'NamaCustomer', 'NoCustomer', 'IDProduk', 'NamaProduk', 'Kategori', 'Qty', 'Panjang', 'Lebar', 'Finishing', 'Desain', 'Cutting', 'Laminating', 'Subtotal'],
    'Expenses': ['ID', 'Tgl', 'Total', 'Toko', 'Detail', 'NotaUrl'],
    'StoreData': ['Key', 'Value']
  };

  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
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
            sheet.getRange(1, sheet.getLastColumn()).setValue(req).setFontWeight("bold");
          }
        });
      }
    }
  }

  let userSheet = ss.getSheetByName('Users');
  if (userSheet && userSheet.getLastRow() === 1) {
    userSheet.appendRow(['U1', 'admin', '-', 'Admin Alinea', '081234567890', 'Yogyakarta', 'admin123', 'admin@alineadesain.com', new Date().toISOString()]);
  }
}

function registerCustomer(data) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Users');
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName('Users');
    }

    const nama = data.Nama || data.nama || 'Customer';
    const noWA = String(data.NoWA || data.noWA || data.nowa || '').trim();
    const cleanWA = noWA.replace(/[^0-9]/g, '');
    const kode = data.KodeKhusus || data.kode || data.kodeKhusus || Math.floor(10000000 + Math.random() * 90000000).toString();
    const id = data.ID || data.id || ('C' + new Date().getTime());
    const alamat = data.Alamat || data.alamat || 'Yogyakarta';
    const password = data.Password || data.password || 'cust123';
    const role = data.Role || data.role || 'customer';
    const cleanName = String(nama).toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = data.Email || data.email || ((cleanName || 'cust') + '@gmail.com');
    const now = data.TglDaftar || data.tglDaftar || new Date().toISOString();

    const existingData = sheet.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < existingData.length; i++) {
      const rowId = String(existingData[i][0] || '');
      const rowKode = String(existingData[i][2] || '');
      const rowWA = String(existingData[i][4] || '').replace(/[^0-9]/g, '');
      if ((rowId && rowId === String(id)) || (cleanWA && rowWA && (rowWA === cleanWA || rowWA.endsWith(cleanWA) || cleanWA.endsWith(rowWA))) || (kode && rowKode === String(kode))) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 4).setValue(nama);
      if (noWA) sheet.getRange(foundRow, 5).setValue(noWA);
      if (alamat) sheet.getRange(foundRow, 6).setValue(alamat);
      if (password && password !== 'cust123') sheet.getRange(foundRow, 7).setValue(password);
      if (email) sheet.getRange(foundRow, 8).setValue(email);
    } else {
      sheet.appendRow([id, role, kode, nama, noWA, alamat, password, email, now]);
    }

    return { success: true, kode: kode, user: { ID: id, Role: role, KodeKhusus: kode, Nama: nama, NoWA: noWA, Alamat: alamat, Password: password, Email: email, TglDaftar: now } };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteUser(userId) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Users');
    if (!sheet) return { success: false, message: 'Sheet Users tidak ditemukan' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'User berhasil dihapus dari spreadsheet' };
      }
    }
    return { success: false, message: 'User tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

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

function fetchAllData() {
  try {
    const ss = getSpreadsheet();
    if (!ss.getSheetByName('Users') || !ss.getSheetByName('Orders')) {
      setupDatabase();
    }
    const orders = getSheetData('Orders');
    const orderItems = getSheetData('OrderItems');

    // Hubungkan item rincian ke masing-masing order jika ada data di OrderItems
    if (orderItems && orderItems.length > 0) {
      const itemsByOrder = {};
      orderItems.forEach(function(it) {
        const oId = String(it.IDOrder || it.idorder || it.id || '');
        if (oId) {
          if (!itemsByOrder[oId]) itemsByOrder[oId] = [];
          const itQty = Number(it.Qty || it.qty || 1);
          const itSubtotal = Number(it.Subtotal || it.subtotal || 0);
          const itHarga = itQty > 0 ? (itSubtotal / itQty) : itSubtotal;

          itemsByOrder[oId].push({
            id: (it.IDProduk || 'ITM') + '_' + itemsByOrder[oId].length,
            productId: it.IDProduk || '-',
            namaProduk: it.NamaProduk || 'Produk',
            kategori: it.Kategori || 'satuan',
            harga: itHarga,
            qty: itQty,
            panjang: Number(it.Panjang || 0),
            lebar: Number(it.Lebar || 0),
            finishing: it.Finishing || '-',
            jasaDesain: Number(it.Desain || 0),
            jasaCutting: Number(it.Cutting || 0),
            jasaLaminating: Number(it.Laminating || 0),
            subtotal: itSubtotal
          });
        }
      });

      orders.forEach(function(ord) {
        const oId = String(ord.ID || '');
        if (itemsByOrder[oId] && itemsByOrder[oId].length > 0) {
          ord.Items = itemsByOrder[oId];
        }
      });
    }

    return {
      users: getSheetData('Users'),
      products: getSheetData('Products'),
      orders: orders,
      orderItems: orderItems,
      expenses: getSheetData('Expenses'),
      storeData: getSheetData('StoreData')
    };
  } catch (e) {
    Logger.log("Error fetchAllData: " + e.message);
    return { users: [], products: [], orders: [], expenses: [], storeData: [] };
  }
}

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
    let idProduk         = data.IDProduk || data.idProduk || '-';
    let namaProduk       = data.NamaProduk || data.namaProduk || '-';
    let kategori         = data.Kategori || data.kategori || 'satuan';
    let qty              = Number(data.Qty || data.qty || 1);
    let panjang          = Number(data.Panjang || data.panjang || 0);
    let lebar            = Number(data.Lebar || data.lebar || 0);
    let finishing        = data.Finishing || data.finishing || '-';

    // Jika order memiliki rincian multi-item (Items)
    if (data.Items && Array.isArray(data.Items) && data.Items.length > 0) {
      namaProduk = data.Items.map(function(it, idx) {
        let spec = (idx + 1) + '. ' + (it.namaProduk || it.NamaProduk || 'Produk') + ' (' + (it.qty || 1) + 'x)';
        if (it.kategori === 'meteran' && it.panjang && it.lebar) {
          spec += ' ' + it.panjang + 'x' + it.lebar + 'cm';
        }
        return spec;
      }).join('; ');
      qty = data.Items.reduce(function(acc, it) { return acc + Number(it.qty || 1); }, 0);
      idProduk = data.Items.length > 1 ? 'MULTI' : (data.Items[0].productId || data.Items[0].IDProduk || '-');
      kategori = data.Items.length > 1 ? 'campuran' : (data.Items[0].kategori || 'satuan');
    }

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

    const lastCol = sheet.getLastColumn();
    let headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    let hasSisaCol = false;
    for (let i = 0; i < headers.length; i++) {
      const cleanH = String(headers[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanH === 'sisatagihan' || cleanH === 'sisa') {
        hasSisaCol = true;
        break;
      }
    }

    if (!hasSisaCol) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue('Sisa Tagihan').setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

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
      'jasalain': Number(data.JasaLain || data.jasaLain || 0),
      'namajasalain': String(data.NamaJasaLain || data.namaJasaLain || ''),
      'filedesain': String(data.FileDesain || data.fileDesain || ''),
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
      if (colMap.hasOwnProperty(key)) return colMap[key];
      return '';
    });

    sheet.appendRow(rowToAppend);

    // Simpan rincian masing-masing item ke Sheet OrderItems jika pesanan memiliki Items
    try {
      if (data.Items && Array.isArray(data.Items) && data.Items.length > 0) {
        let itemSheet = ss.getSheetByName('OrderItems');
        if (!itemSheet) {
          itemSheet = ss.insertSheet('OrderItems');
          itemSheet.appendRow(['IDOrder', 'Tanggal', 'NamaCustomer', 'NoCustomer', 'IDProduk', 'NamaProduk', 'Kategori', 'Qty', 'Panjang', 'Lebar', 'Finishing', 'Desain', 'Cutting', 'Laminating', 'Subtotal']);
          itemSheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
        }
        data.Items.forEach(function(it, idx) {
          itemSheet.appendRow([
            id,
            tgl,
            namaCustomer,
            noCustomer,
            it.productId || it.IDProduk || ('P-' + (idx + 1)),
            it.namaProduk || it.NamaProduk || 'Produk',
            it.kategori || 'satuan',
            Number(it.qty || 1),
            Number(it.panjang || 0),
            Number(it.lebar || 0),
            it.finishing || '-',
            Number(it.jasaDesain || 0),
            Number(it.jasaCutting || 0),
            Number(it.jasaLaminating || 0),
            Number(it.subtotal || 0)
          ]);
        });
      }
    } catch (itErr) {
      Logger.log("Save OrderItems error: " + itErr.message);
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
            const newCustKode = (kodeCustomer && kodeCustomer !== '-') ? kodeCustomer : Math.floor(10000000 + Math.random() * 90000000).toString();
            const cleanCustName = String(namaCustomer).toLowerCase().replace(/[^a-z0-9]/g, '');
            userSheet.appendRow([
              newCustId, 'customer', newCustKode, namaCustomer, noCustomer, 'Yogyakarta', 'cust123', (cleanCustName || 'cust') + '@gmail.com', new Date().toISOString()
            ]);
          }
        }
      }
    } catch (uErr) {
      Logger.log("Auto-save user error: " + uErr.message);
    }

    return { success: true, id: id };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteOrder(orderId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Orders');
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(orderId)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
    // Hapus juga rincian order di sheet OrderItems jika ada
    const itemSheet = ss.getSheetByName('OrderItems');
    if (itemSheet) {
      const iData = itemSheet.getDataRange().getValues();
      for (let i = iData.length - 1; i >= 1; i--) {
        if (String(iData[i][0]) === String(orderId)) {
          itemSheet.deleteRow(i + 1);
        }
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateOrderStatus(orderId, status, noCustomer, orderDetailText) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, 18).setValue(status);
        return { success: true };
      }
    }
    return { success: false };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

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
    if (bayarColIndex === -1) bayarColIndex = 17;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, bayarColIndex).setValue(statusBayar);
        if (statusBayar === 'Lunas' && sisaColIndex > 0) {
          sheet.getRange(i + 1, sisaColIndex).setValue(0);
        }
        return { success: true };
      }
    }
    return { success: false };
  } catch (err) {
    return { success: false };
  }
}

function addProduct(data) {
  const sheet = getSpreadsheet().getSheetByName('Products');
  const id = data.ID || ('P' + new Date().getTime());
  sheet.appendRow([
    id, data.Nama || 'Produk', data.Kategori || 'satuan', Number(data.Harga) || 0,
    data.Deskripsi || '', data.Thumbnail || '', 0,
    Number(data.HargaDesain) || 0, Number(data.HargaCutting) || 0, Number(data.HargaLaminating) || 0
  ]);
  return { success: true, id: id };
}

function deleteProduct(id) {
  const sheet = getSpreadsheet().getSheetByName('Products');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function addExpense(data) {
  const sheet = getSpreadsheet().getSheetByName('Expenses');
  const id = data.ID || ('EXP' + new Date().getTime());
  sheet.appendRow([id, data.Tgl || new Date().toISOString().split('T')[0], Number(data.Total) || 0, data.Toko || '', data.Detail || '', '']);
  return { success: true, id: id };
}

function deleteExpense(id) {
  const sheet = getSpreadsheet().getSheetByName('Expenses');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function saveAllStoreData(storeObj) {
  const sheet = getSpreadsheet().getSheetByName('StoreData');
  if (!sheet) return { success: false };
  for (let k in storeObj) {
    const val = typeof storeObj[k] === 'object' ? JSON.stringify(storeObj[k]) : String(storeObj[k]);
    sheet.appendRow([k, val]);
  }
  return { success: true };
}

function syncFullDatabase(data) {
  try {
    const ss = getSpreadsheet();
    setupDatabase();

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
          ordSheet.getRange(1, ordSheet.getLastColumn()).setValue('Sisa Tagihan').setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
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

            let prodSummary = ord.NamaProduk || '-';
            if (ord.Items && Array.isArray(ord.Items) && ord.Items.length > 0) {
              prodSummary = ord.Items.map(function(it, idx) {
                let s = (idx + 1) + '. ' + (it.namaProduk || 'Produk') + ' (' + (it.qty || 1) + 'x)';
                if (it.kategori === 'meteran' && it.panjang && it.lebar) {
                  s += ' ' + it.panjang + 'x' + it.lebar + 'cm';
                }
                return s;
              }).join('; ');
            }

            const colMap = {
              'id': ord.ID,
              'tgl': ord.Tgl || new Date().toISOString(),
              'tanggal': ord.Tgl || new Date().toISOString(),
              'kodecustomer': ord.KodeCustomer || '-',
              'namacustomer': ord.NamaCustomer || 'Customer',
              'nocustomer': ord.NoCustomer || '-',
              'nowa': ord.NoCustomer || '-',
              'idproduk': ord.IDProduk || (ord.Items && ord.Items.length > 1 ? 'MULTI' : '-'),
              'namaproduk': prodSummary,
              'kategori': ord.Kategori || (ord.Items && ord.Items.length > 1 ? 'campuran' : 'satuan'),
              'qty': Number(ord.Qty || 1),
              'jumlah': Number(ord.Qty || 1),
              'panjang': Number(ord.Panjang || 0),
              'lebar': Number(ord.Lebar || 0),
              'finishing': ord.Finishing || '-',
              'jasacutting': Number(ord.JasaCutting || 0),
              'jasalaminating': Number(ord.JasaLaminating || 0),
              'jasadesain': Number(ord.JasaDesain || 0),
              'jasalain': Number(ord.JasaLain || 0),
              'namajasalain': ord.NamaJasaLain || '',
              'filedesain': ord.FileDesain || '',
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

            // Simpan rincian ke Sheet OrderItems jika ada
            if (ord.Items && Array.isArray(ord.Items) && ord.Items.length > 0) {
              let itemSheet = ss.getSheetByName('OrderItems');
              if (itemSheet) {
                ord.Items.forEach(function(it, idx) {
                  itemSheet.appendRow([
                    ord.ID,
                    ord.Tgl || new Date().toISOString(),
                    ord.NamaCustomer || 'Customer',
                    ord.NoCustomer || '-',
                    it.productId || it.IDProduk || ('P-' + (idx + 1)),
                    it.namaProduk || it.NamaProduk || 'Produk',
                    it.kategori || 'satuan',
                    Number(it.qty || 1),
                    Number(it.panjang || 0),
                    Number(it.lebar || 0),
                    it.finishing || '-',
                    Number(it.jasaDesain || 0),
                    Number(it.jasaCutting || 0),
                    Number(it.jasaLaminating || 0),
                    Number(it.subtotal || 0)
                  ]);
                });
              }
            }
          }
        });
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}`;

  const indexHtmlSnippet = `<!-- Buka file /gas-Index.html di root proyek atau salin kode lengkap di bawah ini ke file Index.html di Google Apps Script -->`;

  const handleCopy = (text: string, type: 'codegs' | 'indexhtml') => {
    navigator.clipboard.writeText(text);
    if (type === 'codegs') {
      setCopiedCodeGs(true);
      setTimeout(() => setCopiedCodeGs(false), 2000);
    } else {
      setCopiedIndexHtml(true);
      setTimeout(() => setCopiedIndexHtml(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Kode Google Apps Script & Index.html Terupdate
              </h3>
              <p className="text-[10px] text-teal-300">
                Lengkap dengan Menu Katalog, Kasir, Biaya Kas, Cetak Struk & Branding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('codegs')}
            className={`px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'codegs'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-teal-600" />
            <span>1. Code.gs</span>
          </button>
          <button
            onClick={() => setActiveTab('indexhtml')}
            className={`px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'indexhtml'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-teal-600" />
            <span>2. Index.html</span>
          </button>
          <button
            onClick={() => setActiveTab('panduan')}
            className={`px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'panduan'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Panduan Deploy & Sync</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'codegs' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-teal-50 border border-teal-100 p-2.5 rounded-xl text-xs">
                <span className="text-teal-900 font-medium">
                  Salin dan tempel ke file <code className="font-bold font-mono">Code.gs</code> di Apps Script:
                </span>
                <button
                  onClick={() => handleCopy(codeGsContent, 'codegs')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-xs"
                >
                  {copiedCodeGs ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Code.gs
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[50vh] leading-relaxed border border-slate-800">
                {codeGsContent}
              </pre>
            </div>
          )}

          {activeTab === 'indexhtml' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  File <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">gas-Index.html</code> Sudah Diperbarui!
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Kode antarmuka Web App lengkap (Katalog Produk, Form DP, Cetak Struk, Kasir & Pengaturan Toko) tersimpan rapi di file root <strong className="font-mono text-emerald-800">/gas-Index.html</strong>.
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      fetch('/gas-Index.html')
                        .then(res => res.text())
                        .then(html => handleCopy(html, 'indexhtml'))
                        .catch(() => handleCopy(indexHtmlSnippet, 'indexhtml'));
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    {copiedIndexHtml ? (
                      <>
                        <Check className="w-4 h-4" /> Seluruh Index.html Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Salin Seluruh Kode Index.html
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2">
                <span className="font-bold text-slate-800 block">Fitur Baru yang Sudah Tersedia di Index.html:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Menu Customer Lengkap:</strong> Beranda, Pesan Cetak (Meteran/Satuan & DP), Katalog Produk, Profil & Riwayat.</li>
                  <li><strong>Menu Admin Terorganisir:</strong> Dashboard Omset/Laba, Transaksi (Orders & Kas Biaya Toko), Customer WA, Produk, Branding Toko.</li>
                  <li><strong>Kolom Sync Web App URL:</strong> Terhubung langsung dengan deployment Apps Script dengan tombol <em>Sync Now</em>.</li>
                  <li><strong>Konfigurasi API WhatsApp:</strong> Dukungan Fonnte, Fonte, Flowkirim lengkap dengan pengujian koneksi langsung.</li>
                  <li><strong>Bebas Login Instan:</strong> Login instan Google & shortcut uji coba cepat telah dihapus sesuai permintaan.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'panduan' && (
            <div className="space-y-4 text-xs text-slate-700">
              {/* Bagian 1: Deploy & Sync */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                <div className="font-bold text-teal-900 flex items-center gap-1.5 text-xs">
                  <span className="text-sm">🔄</span>
                  <span>Cara Pasang & Sinkronisasi Web App URL (Google Apps Script):</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                  <li>Buka Google Spreadsheet Anda &gt; Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Pada file <code className="font-bold font-mono bg-white px-1 py-0.5 rounded">Code.gs</code>, hapus seluruh isinya dan tempel kode dari tab <strong>1. Code.gs</strong>.</li>
                  <li>Buat file HTML baru dengan nama <code className="font-bold font-mono bg-white px-1 py-0.5 rounded">Index</code>, lalu tempel isi dari file <code className="font-mono">gas-Index.html</code>.</li>
                  <li>Simpan proyek (<kbd className="font-mono bg-slate-200 px-1 rounded">Ctrl + S</kbd>).</li>
                  <li>Jalankan fungsi <code className="font-mono bg-teal-100 font-bold px-1 rounded">setupDatabase</code> sekali saja dari menu dropdown Run Apps Script untuk memastikan semua sheet (<code className="font-mono">Users, Products, Orders, Expenses, StoreData</code>) terbuat.</li>
                  <li>Klik <strong>Deploy</strong> &gt; <strong>Deployment Baru</strong> &gt; Pilih jenis <strong>Aplikasi Web</strong>.</li>
                  <li>Pilih <em>Execute as</em>: <strong>Saya (email Anda)</strong>, dan <em>Who has access</em>: <strong>Anyone (Siapa saja)</strong>.</li>
                  <li>Klik <strong>Deploy</strong>, lalu salin URL Web App yang berakhiran <code className="font-mono font-bold">/exec</code>.</li>
                  <li>Buka Akun Admin &gt; Menu <strong>Toko</strong> &gt; Tempel URL ke kolom <strong>Web App URL</strong> &gt; Klik <strong>Sync Now</strong>.</li>
                </ol>
              </div>

              {/* Bagian Opsional: SPREADSHEET_ID */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-2">
                <div className="font-bold text-sky-950 flex items-center gap-1.5 text-xs">
                  <span className="text-sm">📊</span>
                  <span>Sinkronisasi Presisi via SPREADSHEET_ID:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Jika Anda menggunakan Google Apps Script terpisah (standalone) atau ingin memastikan data selalu masuk ke spreadsheet tertentu:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Salin ID Spreadsheet dari URL browser Anda: <code className="font-mono bg-white px-1 py-0.5 rounded border border-sky-200">https://docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit</code></li>
                  <li>Buka <code className="font-bold font-mono">Code.gs</code> di Apps Script, isi bagian atas: <code className="font-mono bg-white px-1 py-0.5 rounded font-bold text-sky-800">SPREADSHEET_ID: "ID_SPREADSHEET_ANDA"</code></li>
                  <li>Jika script dibuat langsung melalui menu <em>Ekstensi &gt; Apps Script</em> pada Google Sheet Anda, kolom ini boleh dibiarkan kosong (<code className="font-mono">""</code>) karena sistem otomatis menggunakan spreadsheet yang sedang aktif.</li>
                </ul>
              </div>

              {/* Bagian 2: WhatsApp API */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <span className="text-sm">💬</span>
                  <span>Cara Konfigurasi API WhatsApp (Fonnte / Fonte / Flowkirim):</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                  <li>Pilih salah satu penyedia gateway WhatsApp: <strong>Fonnte</strong> (fonnte.com), <strong>Fonte</strong> (fonte.id), atau <strong>Flowkirim</strong> (flowkirim.com).</li>
                  <li>Daftar akun gratis, masuk ke dasbor gateway, lalu tautkan nomor WhatsApp toko Anda dengan memindai QR Code.</li>
                  <li>Salin <strong>API Key / Token</strong> dari dasbor penyedia.</li>
                  <li>Buka Akun Admin &gt; Menu <strong>Toko</strong> &gt; Cari kotak <strong>Konfigurasi API WhatsApp</strong>.</li>
                  <li>Pilih provider (misal Fonnte), tempel API Key, dan masukkan nomor WhatsApp toko Anda.</li>
                  <li>Uji coba pengiriman dengan memasukkan nomor WA Anda di kotak pengujian lalu klik <strong>Kirim Pesan Tes</strong>.</li>
                  <li>Klik <strong>Simpan Pengaturan WhatsApp</strong>. Sekarang nota pesanan baru dan pembaruan status akan dikirimkan otomatis ke WhatsApp pelanggan!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
