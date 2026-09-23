import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Globe,
  ShieldCheck,
  Cpu,
  Link,
  Info
} from 'lucide-react';
import { StoreData } from '../types';
import { GAS_CONFIG } from '../config/gasConfig';
import { fetchAllDataFromGas } from '../services/gasSyncService';

interface AdminGasSyncManagerProps {
  storeData: StoreData;
  onUpdateStoreData: (updatedStoreData: Partial<StoreData>) => void;
  onOpenGasModal: () => void;
  onTriggerSyncNow: (url?: string) => Promise<{ success: boolean; message: string }>;
  onPushAllToGas?: (url?: string) => Promise<{ success: boolean; message: string }>;
  counts: {
    users: number;
    products: number;
    orders: number;
    expenses: number;
  };
}

export const AdminGasSyncManager: React.FC<AdminGasSyncManagerProps> = ({
  storeData,
  onUpdateStoreData,
  onOpenGasModal,
  onTriggerSyncNow,
  onPushAllToGas,
  counts
}) => {
  const currentSpreadsheetId = storeData.spreadsheet_id || GAS_CONFIG.SPREADSHEET_ID;
  const currentWebUrl = storeData.gas_web_app_url || GAS_CONFIG.DEFAULT_WEB_APP_URL || '';

  const [customWebUrl, setCustomWebUrl] = useState(currentWebUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [copiedSheetId, setCopiedSheetId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testUrlResult, setTestUrlResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: storeData.last_synced_at ? 'success' : currentWebUrl ? 'idle' : 'error',
    message: storeData.last_synced_at
      ? `Terakhir disinkronkan: ${new Date(storeData.last_synced_at).toLocaleString('id-ID')}`
      : currentWebUrl
      ? 'URL Web App terhubung. Klik "Sync Now" untuk menarik data terbaru.'
      : 'URL Web App Google Sheets belum terhubung. Tempelkan URL deployment di bawah ini.'
  });

  const handleCopySheetId = () => {
    if (!currentSpreadsheetId) return;
    navigator.clipboard.writeText(currentSpreadsheetId);
    setCopiedSheetId(true);
    setTimeout(() => setCopiedSheetId(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!customWebUrl) return;
    navigator.clipboard.writeText(customWebUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveAndTestUrl = async () => {
    const trimmed = customWebUrl.trim();
    if (!trimmed) {
      setTestUrlResult({
        type: 'error',
        message: 'Masukkan URL Deployment Web App Google Apps Script (berakhiran /exec)'
      });
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/')) {
      setTestUrlResult({
        type: 'error',
        message: 'Format URL salah! URL harus diawali dengan https://script.google.com/macros/s/.../exec'
      });
      return;
    }

    setIsTestingUrl(true);
    setTestUrlResult(null);

    try {
      // Uji koneksi langsung
      const testRes = await fetchAllDataFromGas(trimmed);
      if (testRes.success && testRes.data) {
        const uCount = testRes.data.users?.length || 0;
        const pCount = testRes.data.products?.length || 0;
        const oCount = testRes.data.orders?.length || 0;

        // Simpan ke state global toko (otomatis disinkronkan ke server untuk semua perangkat)
        onUpdateStoreData({
          gas_web_app_url: trimmed,
          spreadsheet_id: currentSpreadsheetId,
          last_synced_at: new Date().toISOString()
        });

        setTestUrlResult({
          type: 'success',
          message: `Koneksi Google Spreadsheet BERHASIL! Ditemukan: ${oCount} pesanan, ${pCount} produk, ${uCount} customer.`,
          details: 'URL telah disimpan permanen ke server. Seluruh perangkat baru kini otomatis terhubung!'
        });

        // Trigger update data lokal
        onTriggerSyncNow(trimmed);
      } else {
        setTestUrlResult({
          type: 'error',
          message: testRes.message || 'Gagal membaca data dari Google Spreadsheet.',
          details: 'Pastikan saat Deploy Web App, izin akses disetel ke "Anyone" (Siapa Saja).'
        });
      }
    } catch (err: any) {
      setTestUrlResult({
        type: 'error',
        message: `Kendala koneksi: ${err?.message || 'Gagal memanggil skrip'}`
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatus({
      type: 'idle',
      message: 'Menghubungkan ke Google Sheets & menarik data terbaru...'
    });

    try {
      const targetUrl = customWebUrl.trim() || currentWebUrl || undefined;
      const res = await onTriggerSyncNow(targetUrl);
      if (res.success) {
        onUpdateStoreData({
          last_synced_at: new Date().toISOString()
        });
        setSyncStatus({
          type: 'success',
          message: res.message || 'Sinkronisasi berhasil! Data terupdate dari Google Spreadsheet.'
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message || 'Gagal sinkron. Pastikan deployment Web App berizin "Anyone" (Siapa saja).'
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: `Terjadi kendala: ${err?.message || 'Koneksi terputus'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushAllData = async () => {
    if (!onPushAllToGas) return;

    setIsPushing(true);
    setSyncStatus({
      type: 'idle',
      message: 'Mengirimkan seluruh data lokal (Pesanan, Produk, Customer, Pengeluaran) ke Google Spreadsheet...'
    });

    try {
      const targetUrl = customWebUrl.trim() || currentWebUrl || undefined;
      const res = await onPushAllToGas(targetUrl);
      if (res.success) {
        onUpdateStoreData({
          last_synced_at: new Date().toISOString()
        });
        setSyncStatus({
          type: 'success',
          message: res.message || 'Semua data lokal berhasil dikirim ke Google Spreadsheet!'
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message || 'Gagal mengirim data ke Spreadsheet.'
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: `Gagal mengirim data: ${err?.message || 'Koneksi terputus'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">
                Integrasi Database Google Sheets
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Multi-Device Sync</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sinkronisasi data pesanan, customer, dan produk toko dengan Google Spreadsheet
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGasModal}
          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
        >
          <FileCode className="w-4 h-4 text-teal-600" />
          <span>Lihat & Salin Code.gs</span>
        </button>
      </div>

      {/* Card Info Spreadsheet Master */}
      <div className="p-4 bg-linear-to-br from-slate-900 to-teal-950 text-white rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="font-bold text-xs text-teal-200">
              Google Spreadsheet Master Toko Alinea Desain
            </span>
          </div>
          <span className="text-[10px] text-teal-300 font-mono bg-teal-900/60 px-2 py-0.5 rounded-full border border-teal-700">
            ID Terpasang
          </span>
        </div>

        {/* Informasi Spreadsheet Aktif */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">
              Google Spreadsheet ID
            </span>
            <p className="font-mono text-xs font-semibold text-slate-100 break-all">
              {currentSpreadsheetId}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] bg-teal-600 hover:bg-teal-500 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Sheet</span>
            </a>
            <button
              type="button"
              onClick={handleCopySheetId}
              className="text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
            >
              {copiedSheetId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSheetId ? 'Tersalin' : 'Salin ID'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bagian Input & Hubungkan Web App URL */}
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
            <Link className="w-4 h-4 text-teal-600" />
            <span>Tautan Deployment Web App Google Apps Script</span>
          </div>
          {currentWebUrl && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>URL Terhubung</span>
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Salin URL Web App yang didapat dari menu <strong>Deploy &gt; New deployment &gt; Web app</strong> di Google Apps Script spreadsheet Anda. Saat disimpan, URL ini otomatis tersimpan ke server sehingga perangkat lain (HP kasir, tablet, laptop baru) langsung terhubung secara otomatis.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={customWebUrl}
              onChange={(e) => setCustomWebUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveAndTestUrl}
            disabled={isTestingUrl}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingUrl ? 'animate-spin' : ''}`} />
            <span>{isTestingUrl ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi Sheet'}</span>
          </button>
        </div>

        {customWebUrl && (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedUrl ? 'URL Tersalin' : 'Salin URL'}</span>
            </button>
          </div>
        )}

        {testUrlResult && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              testUrlResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {testUrlResult.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-xs">{testUrlResult.message}</p>
              {testUrlResult.details && (
                <p className="text-[10px] mt-0.5 opacity-80">{testUrlResult.details}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Box */}
      <div
        className={`p-3.5 rounded-2xl border flex items-start gap-2.5 transition ${
          syncStatus.type === 'success'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : syncStatus.type === 'error'
            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        {syncStatus.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : syncStatus.type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <Cpu className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-bold text-xs">
            {syncStatus.type === 'success'
              ? 'Sinkronisasi Aktif'
              : syncStatus.type === 'error'
              ? 'Perlu Perhatian'
              : 'Status Koneksi Database'}
          </p>
          <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">{syncStatus.message}</p>
        </div>
      </div>

      {/* Ringkasan Data Saat Ini */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase">Customer</span>
          <span className="text-sm font-extrabold text-slate-800">{counts.users} Akun</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase">Produk</span>
          <span className="text-sm font-extrabold text-slate-800">{counts.products} Item</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase">Pesanan</span>
          <span className="text-sm font-extrabold text-teal-700">{counts.orders} Masuk</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
          <span className="block text-[10px] text-slate-400 font-bold uppercase">Pengeluaran</span>
          <span className="text-sm font-extrabold text-slate-800">{counts.expenses} Nota</span>
        </div>
      </div>

      {/* Tombol Aksi Utama: Sync Now & Push All */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sedang Menarik Data...' : 'Sync Now (Tarik Data dari Sheet)'}</span>
        </button>

        {onPushAllToGas && (
          <button
            type="button"
            onClick={handlePushAllData}
            disabled={isPushing}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 border border-slate-800"
          >
            <Layers className={`w-4 h-4 ${isPushing ? 'animate-spin text-white' : 'text-teal-400'}`} />
            <span>{isPushing ? 'Mengirim Data...' : 'Kirim Semua Data ke Sheet'}</span>
          </button>
        )}
      </div>

      {/* Panduan 3 Langkah Menghubungkan Google Sheets */}
      <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2 text-[11px] text-amber-950">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Panduan Cepat Menghubungkan Google Sheets ke Aplikasi:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-700 leading-relaxed">
          <li>Buka Google Spreadsheet toko, lalu klik menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
          <li>Salin seluruh kode dari tombol <strong>"Lihat & Salin Code.gs"</strong> di atas, lalu tempelkan ke file <code>Code.gs</code> di Apps Script dan simpan (Ctrl+S).</li>
          <li>Klik tombol biru <strong>Deploy (Terapkan) &gt; New deployment (Deployment baru)</strong>. Pilih tipe <strong>Web app</strong>, atur <em>Execute as:</em> <strong>Me</strong>, dan <em>Who has access:</em> <strong>Anyone (Siapa saja)</strong>.</li>
          <li>Salin URL Web App yang dihasilkan (berakhiran <code>/exec</code>), lalu tempelkan di kotak isian di atas dan klik <strong>"Simpan & Uji Koneksi Sheet"</strong>.</li>
        </ol>
      </div>
    </div>
  );
};
