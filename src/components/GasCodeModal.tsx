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
// Versi 5.0: Sinkronisasi Penuh Database, Orders, Expenses & Toko
// =================================================================

const WA_API_KEY = "MASUKKAN_API_KEY_ANDA_DISINI"; 
const WA_URL = "https://api.fonnte.com/send"; 

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Alinea Desain - Percetakan & Digital Printing')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

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
            sheet.getRange(1, sheet.getLastColumn()).setValue(req).setFontWeight("bold");
          }
        });
      }
    }
  }

  let userSheet = ss.getSheetByName('Users');
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow(['U1', 'admin', '-', 'Admin Alinea', '081234567890', 'Yogyakarta', 'admin123', 'admin@alineadesain.com', new Date().toISOString()]);
  }
}

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

    return { success: true, id: id };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateOrderStatus(orderId, status, noCustomer, orderDetailText) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(orderId)) {
        sheet.getRange(i + 1, 17).setValue(statusBayar);
        return { success: true };
      }
    }
    return { success: false };
  } catch (err) {
    return { success: false };
  }
}

function addProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  const id = data.ID || ('P' + new Date().getTime());
  sheet.appendRow([
    id, data.Nama || 'Produk', data.Kategori || 'satuan', Number(data.Harga) || 0,
    data.Deskripsi || '', data.Thumbnail || '', 0,
    Number(data.HargaDesain) || 0, Number(data.HargaCutting) || 0, Number(data.HargaLaminating) || 0
  ]);
  return { success: true, id: id };
}

function deleteProduct(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Expenses');
  const id = data.ID || ('EXP' + new Date().getTime());
  sheet.appendRow([id, data.Tgl || new Date().toISOString().split('T')[0], Number(data.Total) || 0, data.Toko || '', data.Detail || '', '']);
  return { success: true, id: id };
}

function deleteExpense(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Expenses');
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('StoreData');
  if (!sheet) return { success: false };
  for (let k in storeObj) {
    const val = typeof storeObj[k] === 'object' ? JSON.stringify(storeObj[k]) : String(storeObj[k]);
    sheet.appendRow([k, val]);
  }
  return { success: true };
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
