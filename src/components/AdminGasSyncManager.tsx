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
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Globe,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { StoreData } from '../types';
import { GAS_CONFIG, getActiveGasUrl } from '../config/gasConfig';

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
  const currentWebUrl = storeData.gas_web_app_url || GAS_CONFIG.DEFAULT_WEB_APP_URL;

  const [customWebUrl, setCustomWebUrl] = useState(currentWebUrl);
  const [showDeploymentSettings, setShowDeploymentSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [copiedSheetId, setCopiedSheetId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: storeData.last_synced_at ? 'success' : 'idle',
    message: storeData.last_synced_at
      ? `Terakhir disinkronkan: ${new Date(storeData.last_synced_at).toLocaleString('id-ID')}`
      : 'Sistem otomatis terhubung ke skrip Code.gs & Google Sheets'
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

  const handleSaveCustomUrl = () => {
    const trimmed = customWebUrl.trim();
    onUpdateStoreData({
      gas_web_app_url: trimmed,
      spreadsheet_id: currentSpreadsheetId
    });
    setSyncStatus({
      type: 'success',
      message: trimmed
        ? 'URL Deployment Web App berhasil disimpan ke sistem!'
        : 'Sistem kembali menggunakan setelan otomatis bawaan Code.gs'
    });
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
      message: 'Mengirimkan seluruh data (Pesanan, Produk, Customer, Pengeluaran) ke Google Spreadsheet...'
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
                <span>Terpusat di Code.gs</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Semua data pesanan, customer, dan produk disinkronkan otomatis sesuai file Code.gs
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

      {/* Card Info Terpusat (User & Admin tidak perlu konfigurasi di akun) */}
      <div className="p-4 bg-linear-to-br from-slate-900 to-teal-950 text-white rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-xs text-teal-200">
              Sinkronisasi Otomatis Seluruh Pengguna
            </span>
          </div>
          <span className="text-[10px] text-teal-300 font-mono bg-teal-900/60 px-2 py-0.5 rounded-full border border-teal-700">
            Zero-Config Client
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Pengaturan database telah dipusatkan pada file skrip <strong>Code.gs</strong>. Setiap pengguna (Customer, Kasir, atau Admin) tidak perlu memasukkan ID Spreadsheet maupun URL Web App di pengaturan akun masing-masing.
        </p>

        {/* Informasi Spreadsheet Aktif */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
              Google Spreadsheet Terhubung (ID)
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
              ? 'Kendala Sinkronisasi'
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

      {/* Accordion Opsional: Deployment URL Web App (Hanya untuk Admin jika dibutuhkan) */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-3">
        <button
          type="button"
          onClick={() => setShowDeploymentSettings(!showDeploymentSettings)}
          className="w-full p-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-700 text-xs">
              Pengaturan URL Deployment Web App (Opsional)
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
              Opsional
            </span>
          </div>
          {showDeploymentSettings ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showDeploymentSettings && (
          <div className="p-4 bg-white space-y-3 border-t border-slate-200/80">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Jika Anda men-deploy Google Apps Script sebagai <em>Web App</em> di luar Google Sheets, Anda dapat menempelkan URL berakhiran <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/exec</code> di sini. Pengaturan ini otomatis tersimpan secara global sehingga pengguna lain tidak perlu mengisinya.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customWebUrl}
                onChange={(e) => setCustomWebUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveCustomUrl}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer shrink-0"
              >
                Simpan URL
              </button>
            </div>
            {customWebUrl && (
              <div className="flex items-center gap-2 pt-1">
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
          </div>
        )}
      </div>
    </div>
  );
};
