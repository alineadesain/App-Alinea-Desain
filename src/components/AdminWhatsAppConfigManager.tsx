import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  BellRing,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Check
} from 'lucide-react';
import { StoreData } from '../types';
import { GAS_CONFIG } from '../config/gasConfig';
import {
  checkWhatsAppDeviceStatus,
  sendWhatsAppMessage,
  normalizePhoneNumber,
  DeviceStatusResponse
} from '../services/whatsappService';

interface AdminWhatsAppConfigManagerProps {
  storeData: StoreData;
  onSaveConfig: (updatedStoreData: Partial<StoreData>) => void;
  showToast: (msg: string) => void;
}

export const AdminWhatsAppConfigManager: React.FC<AdminWhatsAppConfigManagerProps> = ({
  storeData,
  onSaveConfig,
  showToast
}) => {
  const currentApiKey = storeData.wa_api_key || GAS_CONFIG.WA_API_KEY;
  const currentSender = storeData.wa_sender_number || storeData.kontak || GAS_CONFIG.WA_SENDER_NUMBER;

  const [testNumber, setTestNumber] = useState(currentSender);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceStatusResponse | null>(null);
  const [testResult, setTestResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const [autoOrder, setAutoOrder] = useState<boolean>(storeData.wa_auto_order ?? true);
  const [autoStatus, setAutoStatus] = useState<boolean>(storeData.wa_auto_status ?? true);

  // Cek status perangkat WhatsApp saat komponen dimuat
  useEffect(() => {
    loadDeviceStatus();
  }, [currentApiKey]);

  const loadDeviceStatus = async () => {
    setIsCheckingDevice(true);
    try {
      const res = await checkWhatsAppDeviceStatus(currentApiKey);
      setDeviceInfo(res);
    } catch (e: any) {
      console.warn('Gagal cek status Fonnte:', e);
    } finally {
      setIsCheckingDevice(false);
    }
  };

  const handleToggleAutoSetting = (key: 'wa_auto_order' | 'wa_auto_status', value: boolean) => {
    if (key === 'wa_auto_order') setAutoOrder(value);
    if (key === 'wa_auto_status') setAutoStatus(value);

    onSaveConfig({
      [key]: value
    });
    showToast('Preferensi notifikasi WhatsApp diperbarui!');
  };

  const handleTestSend = async () => {
    const cleanPhone = normalizePhoneNumber(testNumber);
    if (!cleanPhone || cleanPhone.length < 8) {
      setTestResult({
        type: 'error',
        message: 'Masukkan nomor WhatsApp tujuan yang valid (minimal 8 digit)!'
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    const sampleMessage = `🔔 *[${storeData.nama_toko || 'Alinea Desain'} - UJI COBA GATEWAY WA]*\n\n` +
      `Halo! Ini adalah pesan verifikasi koneksi WhatsApp Gateway aktif.\n\n` +
      `✅ *Status Gateway:* Terhubung & Aktif (Fonnte)\n` +
      `🏷️ *Pengirim:* ${deviceInfo?.name || 'Kasir Alinea Desain'} (${deviceInfo?.device || '62895622909299'})\n` +
      `📱 *Nomor Penerima:* ${cleanPhone}\n` +
      `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}\n\n` +
      `Notifikasi pesanan baru dan perubahan status pengerjaan siap terkirim otomatis ke pelanggan di seluruh perangkat (hp, laptop, tablet). Terima kasih! 🙏`;

    try {
      const res = await sendWhatsAppMessage(cleanPhone, sampleMessage, currentApiKey);
      if (res.success) {
        setTestResult({
          type: 'success',
          message: `Pesan uji coba BERHASIL dikirim ke WhatsApp ${cleanPhone}!`,
          details: res.message
        });
        showToast(`WhatsApp terkirim ke ${cleanPhone}!`);
        // Refresh status kuota
        loadDeviceStatus();
      } else {
        setTestResult({
          type: 'error',
          message: `Gagal mengirim: ${res.message}`,
          details: JSON.stringify(res.detail || '')
        });
      }
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: `Kendala pengiriman: ${err?.message || 'Koneksi terputus'}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">
                Gateway WhatsApp Otomatis (Fonnte)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Terhubung di Semua Perangkat</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Notifikasi pesanan baru & status pengerjaan terkirim langsung ke nomor WhatsApp pelanggan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={loadDeviceStatus}
            disabled={isCheckingDevice}
            className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Cek Status Perangkat Fonnte"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isCheckingDevice ? 'animate-spin' : ''}`} />
            <span>Cek Status</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-teal-600" />
            <span>{showGuide ? 'Tutup Panduan' : 'Panduan'}</span>
          </button>
        </div>
      </div>

      {/* Card Status Gateway Fonnte */}
      <div className="p-4 bg-linear-to-br from-emerald-950 to-slate-900 text-white rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-xs text-emerald-300">
              Gateway WhatsApp Aktif & Siap Kirim
            </span>
          </div>
          <span className="text-[10px] text-emerald-300 font-mono bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700 flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            <span>Fonnte Connected</span>
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Sistem gateway WhatsApp telah terhubung secara permanen dengan akun Fonnte toko. Setiap ada pesanan masuk atau perubahan status, sistem langsung mengirim pesan ke WhatsApp pelanggan dari semua perangkat.
        </p>

        {/* Live Device Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[9px] text-emerald-400 font-bold uppercase block tracking-wider">Perangkat Gateway</span>
            <span className="font-semibold text-slate-100 block truncate">
              {deviceInfo?.name || 'Kasir Alinea Desain'}
            </span>
            <span className="text-[10px] font-mono text-emerald-300 block">
              {deviceInfo?.device || '62895622909299'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[9px] text-emerald-400 font-bold uppercase block tracking-wider">Status Koneksi</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{deviceInfo?.device_status === 'connect' || !deviceInfo ? 'Terhubung' : 'Standby'}</span>
            </span>
            <span className="text-[10px] text-slate-400 block">Siap Kirim</span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[9px] text-emerald-400 font-bold uppercase block tracking-wider">Sisa Kuota Pesan</span>
            <span className="font-extrabold text-amber-300 text-sm block">
              {deviceInfo?.quota ?? '999'}
            </span>
            <span className="text-[10px] text-slate-400 block">Pesan tersisa</span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[9px] text-emerald-400 font-bold uppercase block tracking-wider">Paket Fonnte</span>
            <span className="font-bold text-slate-200 block">
              {deviceInfo?.package || 'Free Tier'}
            </span>
            <span className="text-[10px] text-slate-400 block">Aktif</span>
          </div>
        </div>
      </div>

      {/* Pengaturan Pemicu Notifikasi Otomatis */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
          <BellRing className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pengaturan Pemicu Notifikasi Otomatis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="flex items-start gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 transition shadow-2xs">
            <input
              type="checkbox"
              checked={autoOrder}
              onChange={(e) => handleToggleAutoSetting('wa_auto_order', e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-800 block text-xs">Kirim Saat Order Baru</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                Kirim rincian nota pesanan, nomor invoice, dan detail pembayaran ke WhatsApp pelanggan saat order masuk.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 transition shadow-2xs">
            <input
              type="checkbox"
              checked={autoStatus}
              onChange={(e) => handleToggleAutoSetting('wa_auto_status', e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-800 block text-xs">Kirim Saat Status Pengerjaan Berubah</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                Otomatis kirim kabar saat pesanan masuk produksi, selesai, atau siap diambil di toko.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Uji Coba Pengiriman Pesan WhatsApp Nyata */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>Uji Coba Kirim Pesan Nyata ke WhatsApp Anda</span>
        </div>
        <p className="text-[11px] text-slate-600">
          Ketik nomor WhatsApp aktif Anda untuk menguji bahwa pesan benar-benar terkirim dan diterima di aplikasi WhatsApp Anda.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="Contoh: 085815950700 atau 628..."
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-emerald-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleTestSend}
            disabled={isSendingTest}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-bounce' : ''}`} />
            <span>{isSendingTest ? 'Mengirim ke WhatsApp...' : 'Kirim Pesan Uji Coba'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              testResult.type === 'success'
                ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-100/80 border-rose-300 text-rose-950'
            }`}
          >
            {testResult.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-xs">{testResult.message}</p>
              {testResult.details && (
                <p className="text-[10px] font-mono mt-1 opacity-80">{testResult.details}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panduan Ringkas jika Dibuka */}
      {showGuide && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-[11px] text-slate-600">
          <p className="font-bold text-slate-800">Cara Kerja WhatsApp Gateway:</p>
          <ul className="list-disc list-inside space-y-1 ml-1 text-slate-600">
            <li>Gateway menggunakan API resmi Fonnte dengan nomor pengirim <strong>Kasir Alinea Desain (62895622909299)</strong>.</li>
            <li>Sistem mengirimkan pesan secara instan baik saat diakses dari HP, Laptop, atau Tablet baru.</li>
            <li>Setiap nomor tujuan otomatis dikonversi ke format internasional (misal: 0858... menjadi 62858...).</li>
            <li>Jika ingin mengganti nomor pengirim, Anda cukup menautkan nomor baru di dashboard <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">fonnte.com <ExternalLink className="w-3 h-3 inline" /></a>.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
