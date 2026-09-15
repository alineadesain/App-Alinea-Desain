import React, { useState } from 'react';
import {
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Layers,
  FileCode,
  ShieldCheck,
  ArrowRight,
  UploadCloud
} from 'lucide-react';
import { StoreData } from '../types';

interface AdminGasSyncManagerProps {
  storeData: StoreData;
  onUpdateStoreData: (updatedStoreData: Partial<StoreData>) => void;
  onOpenGasModal: () => void;
  onTriggerSyncNow: (url: string) => Promise<{ success: boolean; message: string }>;
  onPushAllToGas?: (url: string) => Promise<{ success: boolean; message: string }>;
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
  const [webAppUrl, setWebAppUrl] = useState(storeData.gas_web_app_url || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: storeData.last_synced_at ? 'success' : 'idle',
    message: storeData.last_synced_at
      ? `Terakhir disinkronkan: ${new Date(storeData.last_synced_at).toLocaleString('id-ID')}`
      : 'Database belum disinkronkan dengan Web App URL'
  });
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const isValidUrl =
    webAppUrl.trim().startsWith('https://script.google.com/macros/s/') &&
    webAppUrl.trim().endsWith('/exec');

  const handleSyncNow = async () => {
    const trimmedUrl = webAppUrl.trim();
    if (!trimmedUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu!'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({
      type: 'idle',
      message: 'Menghubungkan & menarik data terbaru dari Google Spreadsheet...'
    });

    try {
      // Save URL locally first
      onUpdateStoreData({
        gas_web_app_url: trimmedUrl,
        last_synced_at: new Date().toISOString()
      });

      const res = await onTriggerSyncNow(trimmedUrl);
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: res.message || 'Sinkronisasi berhasil! Data tersambung dua arah.'
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message || 'Gagal menyinkronkan data. Periksa izin deployment Apps Script Anda.'
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
    const trimmedUrl = webAppUrl.trim();
    if (!trimmedUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu!'
      });
      return;
    }

    setIsPushing(true);
    setSyncStatus({
      type: 'idle',
      message: 'Mengirimkan seluruh data (Pesanan, Produk, Customer, Pengeluaran) ke Google Spreadsheet...'
    });

    try {
      onUpdateStoreData({
        gas_web_app_url: trimmedUrl,
        last_synced_at: new Date().toISOString()
      });

      if (onPushAllToGas) {
        const res = await onPushAllToGas(trimmedUrl);
        setSyncStatus({
          type: res.success ? 'success' : 'error',
          message: res.message
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: `Gagal mengirim data ke Spreadsheet: ${err?.message || 'Koneksi terputus'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyUrl = () => {
    if (!webAppUrl) return;
    navigator.clipboard.writeText(webAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">
                Integrasi Web App URL Google Sheets
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  storeData.gas_web_app_url
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {storeData.gas_web_app_url ? '● Terkonfigurasi' : '○ Perlu Disetel'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hubungkan sistem aplikasi toko ke Google Sheets melalui Apps Script Web App
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGasModal}
          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-center"
        >
          <FileCode className="w-4 h-4 text-teal-600" />
          <span>Lihat & Salin Kode GAS</span>
        </button>
      </div>

      {/* Input Field Kolom Web App URL & Tombol Sync Now */}
      <div className="space-y-3">
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              URL Web App Apps Script (Spreadsheet Backend)
            </span>
            {webAppUrl && (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
              </button>
            )}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || isPushing}
                title="Tarik data terbaru dari Google Spreadsheet ke aplikasi"
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold px-4 py-3 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Now (Tarik Data)'}</span>
              </button>
              {onPushAllToGas && (
                <button
                  type="button"
                  onClick={handlePushAllData}
                  disabled={isSyncing || isPushing}
                  title="Kirim seluruh data pesanan, produk, customer & kas yang ada ke Google Spreadsheet"
                  className="bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold px-4 py-3 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                  <span>{isPushing ? 'Mengirim Data...' : 'Kirim Semua ke Sheet'}</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className={isValidUrl ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
              {webAppUrl ? (
                isValidUrl ? (
                  '✓ Format URL Web App Valid (Google Apps Script /exec)'
                ) : (
                  '⚠ Pastikan URL berakhiran /exec dari deployment Aplikasi Web'
                )
              ) : (
                'Tempelkan tautan Web App URL dari Deployment Google Sheets Anda'
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowTutorial(!showTutorial)}
              className="font-bold text-teal-600 hover:text-teal-800 underline underline-offset-2"
            >
              {showTutorial ? 'Tutup Panduan Cara Sync' : 'Cara Mendapatkan Web App URL?'}
            </button>
          </div>
        </div>

        {/* Status Box */}
        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 transition ${
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
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-xs">
              {syncStatus.type === 'success'
                ? 'Status Sinkronisasi Aktif'
                : syncStatus.type === 'error'
                ? 'Perhatian Sinkronisasi'
                : 'Status Koneksi Database'}
            </p>
            <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">{syncStatus.message}</p>
          </div>
        </div>

        {/* Live Data Summary Pills */}
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
      </div>

      {/* Tutorial / Keterangan Cara Sync Web App URL */}
      {showTutorial && (
        <div className="mt-4 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-xs border-b border-teal-200/60 pb-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Panduan Langkah Demi Langkah Cara Sync Web App URL Apps Script</span>
          </div>

          <div className="space-y-2.5 text-[11px] text-slate-700">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong>Buka Google Sheets:</strong> Buat Spreadsheet baru di Google Drive Anda atau buka spreadsheet percetakan Anda.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong>Buka Editor Apps Script:</strong> Klik menu <code>Ekstensi (Extensions)</code> &gt; <code>Apps Script</code>.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong>Pasang Kode:</strong> Klik tombol <strong>"Lihat & Salin Kode GAS"</strong> di atas. Salin kode <code>Code.gs</code> ke file <code>Code.gs</code> di Apps Script, dan salin kode <code>Index.html</code> ke file HTML baru bernama <code>Index</code>.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong>Deploy Web App:</strong> Klik tombol biru <strong>Deploy</strong> (kanan atas) &gt; <strong>Deployment Baru (New Deployment)</strong>.
                <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5 text-slate-600">
                  <li>Pilih jenis: <strong>Aplikasi Web (Web App)</strong>.</li>
                  <li>Jalankan sebagai (Execute as): <strong>Saya (email Anda)</strong>.</li>
                  <li>Yang memiliki akses (Who has access): <strong>Siapa saja (Anyone)</strong> <span className="text-rose-600 font-bold">(Wajib dipilih agar data bisa sinkron)</span>.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                5
              </span>
              <div>
                <strong>Salin Web App URL:</strong> Salin URL yang berakhiran <code>/exec</code>, lalu tempelkan ke kolom input <strong>URL Web App Apps Script</strong> di atas.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                6
              </span>
              <div>
                <strong>Klik "Sync Now":</strong> Tekan tombol <strong>Sync Now</strong>. Seluruh data sheet <code>Users</code>, <code>Produk</code>, <code>Orders</code>, <code>Pengeluaran</code>, dan <code>StoreData</code> akan otomatis terhubung secara real-time!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
