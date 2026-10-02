import React, { useState, useEffect } from 'react';
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
  Link2,
  Info,
  Save,
  Trash2,
  Edit3,
  Server
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
  const currentWebUrl = storeData.gas_web_app_url || '';

  const [customWebUrl, setCustomWebUrl] = useState(currentWebUrl);
  const [customSheetId, setCustomSheetId] = useState(currentSpreadsheetId);
  const [isEditingSheetId, setIsEditingSheetId] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [copiedSheetId, setCopiedSheetId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [testUrlResult, setTestUrlResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
    sheetBreakdown?: {
      orders: number;
      products: number;
      users: number;
      expenses: number;
      storeDataFound: boolean;
    };
  } | null>(null);

  // Selalu sinkronkan state lokal saat storeData berubah dari server
  useEffect(() => {
    setCustomWebUrl(storeData.gas_web_app_url || '');
  }, [storeData.gas_web_app_url]);

  useEffect(() => {
    setCustomSheetId(storeData.spreadsheet_id || GAS_CONFIG.SPREADSHEET_ID);
  }, [storeData.spreadsheet_id]);

  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: storeData.last_synced_at ? 'success' : currentWebUrl ? 'idle' : 'error',
    message: storeData.last_synced_at
      ? `Terakhir disinkronkan: ${new Date(storeData.last_synced_at).toLocaleString('id-ID')}`
      : currentWebUrl
      ? 'URL Web App manual terpasang. Klik "Uji Koneksi & Tarik Sheet" atau "Sync Now" untuk verifikasi.'
      : 'URL Web App belum diatur. Masukkan URL deployment Google Apps Script Anda di bawah.'
  });

  const handleCopySheetId = () => {
    const idToCopy = customSheetId || currentSpreadsheetId;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedSheetId(true);
    setTimeout(() => setCopiedSheetId(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!customWebUrl) return;
    navigator.clipboard.writeText(customWebUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Simpan URL secara manual ke Pengaturan Toko & Server Sinkronisasi
  const handleSaveUrlOnly = () => {
    const trimmed = customWebUrl.trim();
    if (trimmed && !trimmed.startsWith('https://script.google.com/')) {
      setTestUrlResult({
        type: 'error',
        message: 'Format URL tidak valid!',
        details: 'URL Web App Google Apps Script harus diawali dengan https://script.google.com/macros/s/.../exec'
      });
      return;
    }

    onUpdateStoreData({
      gas_web_app_url: trimmed,
      spreadsheet_id: customSheetId.trim() || currentSpreadsheetId
    });

    setSaveSuccessMsg('URL Web App Google Apps Script berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Kosongkan URL
  const handleClearUrl = () => {
    if (window.confirm('Kosongkan URL Web App? Aplikasi akan beralih ke mode database lokal.')) {
      setCustomWebUrl('');
      onUpdateStoreData({
        gas_web_app_url: ''
      });
      setTestUrlResult(null);
      setSyncStatus({
        type: 'idle',
        message: 'URL Web App dikosongkan. Aplikasi berjalan dalam penyimpanan server lokal.'
      });
    }
  };

  // Simpan ID Spreadsheet jika diedit
  const handleSaveSheetId = () => {
    const trimmed = customSheetId.trim();
    if (!trimmed) return;
    onUpdateStoreData({
      spreadsheet_id: trimmed
    });
    setIsEditingSheetId(false);
    setSaveSuccessMsg('ID Google Spreadsheet berhasil diperbarui!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Uji koneksi langsung ke Google Apps Script dan periksa semua sheet
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
      // 1. Simpan URL terlebih dahulu
      onUpdateStoreData({
        gas_web_app_url: trimmed,
        spreadsheet_id: customSheetId.trim() || currentSpreadsheetId,
        last_synced_at: new Date().toISOString()
      });

      // 2. Uji panggil fetchAllData
      const testRes = await fetchAllDataFromGas(trimmed);
      if (testRes.success && testRes.data) {
        const uCount = testRes.data.users?.length || 0;
        const pCount = testRes.data.products?.length || 0;
        const oCount = testRes.data.orders?.length || 0;
        const eCount = testRes.data.expenses?.length || 0;
        const hasStore = !!testRes.data.storeData;

        setTestUrlResult({
          type: 'success',
          message: 'Koneksi ke Google Spreadsheet BERHASIL!',
          details: 'Seluruh sheet di spreadsheet terhubung dengan sempurna. Data terbaru otomatis disinkronkan.',
          sheetBreakdown: {
            orders: oCount,
            products: pCount,
            users: uCount,
            expenses: eCount,
            storeDataFound: hasStore
          }
        });

        setSyncStatus({
          type: 'success',
          message: `Terhubung live ke Google Spreadsheet. Terakhir cek: ${new Date().toLocaleTimeString('id-ID')}`
        });

        // Trigger sinkronisasi data lokal ke state React
        onTriggerSyncNow(trimmed);
      } else {
        setTestUrlResult({
          type: 'error',
          message: testRes.message || 'Gagal terhubung ke Google Apps Script Spreadsheet.',
          details:
            'Pastikan: 1) Saat Deploy Web App, "Who has access" disetel ke "Anyone" (Siapa saja). 2) SPREADSHEET_ID di file Code.gs sudah sesuai dengan ID spreadsheet Anda. 3) Jalankan fungsi setupDatabase di Apps Script sekali jika sheet belum terbuat.'
        });
        setSyncStatus({
          type: 'error',
          message: testRes.message || 'Koneksi gagal. Periksa izin deployment Web App.'
        });
      }
    } catch (err: any) {
      setTestUrlResult({
        type: 'error',
        message: `Kendala koneksi: ${err?.message || 'Gagal memanggil skrip'}`,
        details: 'Pastikan koneksi internet aktif dan URL Web App berakhiran /exec.'
      });
      setSyncStatus({
        type: 'error',
        message: `Gagal memanggil URL Web App: ${err?.message}`
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
      const targetUrl = customWebUrl.trim() || undefined;
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
      const targetUrl = customWebUrl.trim() || undefined;
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

  const isUrlModified = customWebUrl.trim() !== (storeData.gas_web_app_url || '').trim();

  return (
    <div id="section-spreadsheet-sync" className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">
                Integrasi Database Google Sheets & Web App URL
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Input Manual</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Hubungkan database Google Sheets toko Anda melalui URL Web App Google Apps Script
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGasModal}
          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 self-start sm:self-center cursor-pointer shadow-2xs"
        >
          <FileCode className="w-4 h-4 text-teal-600" />
          <span>Lihat & Salin Code.gs</span>
        </button>
      </div>

      {/* Pesan Sukses Simpan */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Bagian Input Manual Web App URL (Prioritas Utama Sesuai Instruksi Pengguna) */}
      <div className="p-4 bg-teal-50/40 border-2 border-teal-600/30 rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-extrabold text-slate-800 text-xs">
            <Globe className="w-4 h-4 text-teal-600" />
            <span>Input Manual Web App URL (Google Apps Script)</span>
          </div>
          {storeData.gas_web_app_url ? (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>URL Manual Tersimpan</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Belum Ada URL - Masukkan URL Di Bawah</span>
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Tempelkan <strong>URL Web App</strong> yang Anda dapatkan saat melakukan <em>Deploy &gt; New deployment &gt; Web app</em> di spreadsheet toko Anda (harus berakhiran <code>/exec</code>). Dengan sistem input manual ini, Anda bebas memperbarui atau mengganti URL Web App kapan saja tanpa keterikatan permanen di script.
        </p>

        {/* Kotak Input URL */}
        <div className="space-y-2">
          <div className="relative">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={customWebUrl}
              onChange={(e) => setCustomWebUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Indikator Belum Disimpan */}
          {isUrlModified && (
            <div className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Terdapat perubahan URL yang belum disimpan. Klik tombol <strong>"Simpan URL Web App"</strong> untuk menerapkan.</span>
            </div>
          )}

          {/* Tombol Aksi URL */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveUrlOnly}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan URL Web App</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndTestUrl}
              disabled={isTestingUrl || !customWebUrl.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingUrl ? 'animate-spin text-white' : 'text-teal-400'}`} />
              <span>{isTestingUrl ? 'Menguji & Memeriksa Sheet...' : 'Uji Koneksi & Tarik Sheet'}</span>
            </button>

            {customWebUrl && (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer text-[11px]"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
              </button>
            )}

            {customWebUrl && (
              <button
                type="button"
                onClick={handleClearUrl}
                className="bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-medium px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer text-[11px] ml-auto"
                title="Kosongkan URL"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan URL</span>
              </button>
            )}
          </div>
        </div>

        {/* Hasil Pengujian Live Koneksi */}
        {testUrlResult && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
              testUrlResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testUrlResult.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-extrabold text-xs">{testUrlResult.message}</p>
                {testUrlResult.details && (
                  <p className="text-[11px] mt-1 leading-relaxed opacity-90">{testUrlResult.details}</p>
                )}
              </div>
            </div>

            {/* Rincian Status Setiap Sheet di Spreadsheet */}
            {testUrlResult.sheetBreakdown && (
              <div className="mt-2 pt-2 border-t border-emerald-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="block text-slate-500 font-semibold uppercase">Sheet Orders</span>
                  <span className="text-xs font-bold text-teal-800">{testUrlResult.sheetBreakdown.orders} Baris</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="block text-slate-500 font-semibold uppercase">Sheet Products</span>
                  <span className="text-xs font-bold text-teal-800">{testUrlResult.sheetBreakdown.products} Baris</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="block text-slate-500 font-semibold uppercase">Sheet Users</span>
                  <span className="text-xs font-bold text-teal-800">{testUrlResult.sheetBreakdown.users} Baris</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="block text-slate-500 font-semibold uppercase">Sheet Expenses</span>
                  <span className="text-xs font-bold text-teal-800">{testUrlResult.sheetBreakdown.expenses} Baris</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Info Spreadsheet ID (Dapat Dilihat / Diperbarui) */}
      <div className="p-4 bg-linear-to-br from-slate-900 to-teal-950 text-white rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="font-bold text-xs text-teal-200">
              Google Spreadsheet ID Toko
            </span>
          </div>
          <span className="text-[10px] text-teal-300 font-mono bg-teal-900/60 px-2 py-0.5 rounded-full border border-teal-700">
            ID Database
          </span>
        </div>

        {/* Informasi Spreadsheet ID & Edit Mode */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5 flex-1">
            <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">
              Google Spreadsheet ID
            </span>
            {isEditingSheetId ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  className="w-full text-xs p-1.5 bg-slate-900 border border-teal-500 text-teal-200 rounded font-mono focus:outline-none"
                  placeholder="Masukkan Spreadsheet ID"
                />
                <button
                  type="button"
                  onClick={handleSaveSheetId}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSheetId(false)}
                  className="bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <p className="font-mono text-xs font-semibold text-slate-100 break-all">
                {customSheetId || currentSpreadsheetId}
              </p>
            )}
          </div>
          {!isEditingSheetId && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://docs.google.com/spreadsheets/d/${customSheetId || currentSpreadsheetId}/edit`}
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
              <button
                type="button"
                onClick={() => setIsEditingSheetId(true)}
                className="text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium px-2 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                title="Ubah Spreadsheet ID"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Box Koneksi */}
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

      {/* Panduan 4 Langkah Menghubungkan Google Sheets */}
      <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2 text-[11px] text-amber-950">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Panduan Deploy & Input Manual Web App URL:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-700 leading-relaxed">
          <li>Buka Google Spreadsheet toko Anda, lalu klik menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
          <li>Salin kode dari tombol <strong>"Lihat & Salin Code.gs"</strong> di atas, lalu tempelkan ke file <code>Code.gs</code> di Apps Script dan simpan (Ctrl+S).</li>
          <li>Klik tombol biru <strong>Deploy (Terapkan) &gt; New deployment (Deployment baru)</strong>. Pilih tipe <strong>Web app</strong>, atur <em>Execute as:</em> <strong>Me</strong>, dan <em>Who has access:</em> <strong>Anyone (Siapa saja)</strong>.</li>
          <li>Salin URL Web App yang dihasilkan (berakhiran <code>/exec</code>), tempelkan di kotak <strong>"Input Manual Web App URL"</strong> di atas, lalu klik <strong>"Simpan URL Web App"</strong> atau <strong>"Uji Koneksi & Tarik Sheet"</strong>.</li>
        </ol>
      </div>
    </div>
  );
};
