import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Copy,
  Check,
  ChevronRight,
  Download,
  Share2,
  Image as ImageIcon,
  Cloud,
  Loader2,
  FileText,
  Receipt
} from 'lucide-react';
import { Order, StoreData, User, BankAccount, OrderItem } from '../types';
import {
  findCustomerPhone,
  cleanWhatsAppPhone,
  formatOrderWhatsAppConfirmation,
  formatCustomerToAdminWhatsAppConfirmation,
  createWhatsAppUrl,
  getOrderDisplayItems
} from '../utils/whatsappFormatter';
import { uploadNotaImageToDrive } from '../services/driveSyncService';

interface OrderDetailModalProps {
  order: Order | null;
  storeData: StoreData;
  onClose: () => void;
  users?: User[];
  orderItems?: any[];
  userRole?: 'admin' | 'customer';
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  storeData,
  onClose,
  users = [],
  orderItems = [],
  userRole = 'customer'
}) => {
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const [printMedia, setPrintMedia] = useState<'a4' | 'thermal' | 'a5'>('a4');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    driveUrl?: string;
  } | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);

  const captureNotaRef = useRef<HTMLDivElement>(null);

  // Normalisasi bank accounts toko agar selalu array aman
  const normalizedBankAccounts: BankAccount[] = useMemo(() => {
    if (!storeData?.bank_accounts) return [];
    if (Array.isArray(storeData.bank_accounts)) return storeData.bank_accounts;
    if (typeof storeData.bank_accounts === 'string') {
      try {
        const parsed = JSON.parse(storeData.bank_accounts);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  }, [storeData?.bank_accounts]);

  // Ekstrak rincian produk (baik dari order.Items, sheet OrderItems, maupun sheet Orders)
  const displayItems: OrderItem[] = useMemo(() => {
    if (!order) return [];
    try {
      return getOrderDisplayItems(order, orderItems);
    } catch (e) {
      console.error('Error getting display items:', e);
      return [];
    }
  }, [order, orderItems]);

  if (!order) return null;

  const formatRp = (num: any) => {
    return 'Rp ' + Math.round(Number(num) || 0).toLocaleString('id-ID');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(isoString);
    }
  };

  const getStatusBadge = (status: Order['StatusOrder']) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case 'Proses':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> Dalam Pengerjaan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" /> Order Masuk
          </span>
        );
    }
  };

  const getBayarBadge = (bayar: Order['StatusBayar']) => {
    switch (bayar) {
      case 'Lunas':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full text-xs font-bold">
            Lunas
          </span>
        );
      case 'DP':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
            Uang Muka (DP)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">
            Belum Lunas
          </span>
        );
    }
  };

  const handleCopyRekening = (textToCopy?: string, bankId?: string) => {
    const text = textToCopy || storeData.rekening;
    if (text) {
      navigator.clipboard.writeText(String(text));
      if (bankId) {
        setCopiedBankId(bankId);
        setTimeout(() => setCopiedBankId(null), 2000);
      } else {
        setCopiedRekening(true);
        setTimeout(() => setCopiedRekening(false), 2000);
      }
    }
  };

  const dpAmount = Number(order.NominalDP || order.DP || 0);
  const totalAmount = Number(order.TotalHarga || 0);
  const sisaTagihan =
    order.SisaTagihan !== undefined
      ? Number(order.SisaTagihan)
      : Math.max(0, totalAmount - dpAmount);

  // Helper membuat render snapshot gambar nota menggunakan html2canvas
  const generateNotaCanvas = async (): Promise<{ dataUrl: string; blob: Blob } | null> => {
    if (!captureNotaRef.current) return null;
    try {
      const canvas = await html2canvas(captureNotaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
      if (!blob) return null;
      return { dataUrl, blob };
    } catch (err) {
      console.error('Error html2canvas:', err);
      return null;
    }
  };

  // Simpan / Download gambar nota ke perangkat dan otomatis cadangkan ke Google Drive
  const handleDownloadNotaImage = async () => {
    if (!order) return;
    setIsProcessingImage(true);
    setFeedbackMessage(null);

    try {
      const result = await generateNotaCanvas();
      if (!result) {
        setFeedbackMessage({ type: 'error', text: 'Gagal membuat gambar nota. Silakan coba lagi.' });
        return;
      }

      const { dataUrl } = result;
      const cleanCustomer = order.NamaCustomer ? order.NamaCustomer.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
      const fileName = `Nota_${order.ID}_${cleanCustomer}.png`;

      // 1. Download file gambar PNG ke browser perangkat
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 2. Simpan otomatis ke Google Drive (📁 Nota Transaksi)
      const driveRes = await uploadNotaImageToDrive(
        order.ID,
        order.NamaCustomer,
        dataUrl,
        storeData.nama_toko,
        storeData.gas_web_app_url
      );

      setFeedbackMessage({
        type: 'success',
        text: driveRes.url
          ? 'Gambar nota berhasil diunduh & tersimpan di Google Drive (📁 Nota Transaksi)!'
          : 'Gambar nota berhasil diunduh ke perangkat Anda!',
        driveUrl: driveRes.driveUrl || driveRes.url
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Gagal menyimpan gambar: ${err?.message || 'Error'}`
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Share gambar nota ke customer (Web Share API atau WhatsApp dengan tautan Google Drive)
  const handleShareNotaImage = async () => {
    if (!order) return;
    setIsProcessingImage(true);
    setFeedbackMessage(null);

    try {
      const result = await generateNotaCanvas();
      if (!result) {
        setFeedbackMessage({ type: 'error', text: 'Gagal merender gambar nota.' });
        return;
      }

      const { dataUrl, blob } = result;
      const cleanCustomer = order.NamaCustomer ? order.NamaCustomer.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
      const fileName = `Nota_${order.ID}_${cleanCustomer}.png`;

      // Simpan ke Google Drive untuk tautan arsip cloud
      const driveRes = await uploadNotaImageToDrive(
        order.ID,
        order.NamaCustomer,
        dataUrl,
        storeData.nama_toko,
        storeData.gas_web_app_url
      );

      const customerRawPhone = findCustomerPhone(order, users);
      const destPhone = cleanWhatsAppPhone(customerRawPhone);

      // 1. Coba Share via Web Share API jika browser mendukung file sharing
      let sharedViaNavigator = false;
      if (typeof navigator !== 'undefined' && (navigator as any).canShare) {
        try {
          const fileToShare = new File([blob], fileName, { type: 'image/png' });
          if ((navigator as any).canShare({ files: [fileToShare] })) {
            await navigator.share({
              title: `Nota Pesanan #${order.ID}`,
              text: `Halo ${order.NamaCustomer}, berikut adalah nota resmi pesanan #${order.ID} dari ${storeData.nama_toko || 'Alinea Desain'}.`,
              files: [fileToShare]
            });
            sharedViaNavigator = true;
          }
        } catch (shareErr) {
          console.log('Web share ditutup atau dibatalkan:', shareErr);
        }
      }

      // 2. Jika tidak melalui Web Share API, kirim via WhatsApp dengan URL Drive
      if (!sharedViaNavigator) {
        let baseMsg = formatOrderWhatsAppConfirmation(order, storeData, orderItems);
        if (driveRes.driveUrl || driveRes.url) {
          baseMsg += `\n\n🖼️ *Link Gambar Nota (Google Drive):*\n${driveRes.driveUrl || driveRes.url}`;
        }
        if (destPhone) {
          const waUrl = createWhatsAppUrl(destPhone, baseMsg);
          window.open(waUrl, '_blank');
        } else {
          const csPhone = cleanWhatsAppPhone(storeData.kontak || '085815950700');
          const waUrl = createWhatsAppUrl(csPhone, baseMsg);
          window.open(waUrl, '_blank');
        }
      }

      setFeedbackMessage({
        type: 'success',
        text: 'Nota siap dibagikan! Tautan Google Drive telah disertakan ke pesan WhatsApp.',
        driveUrl: driveRes.driveUrl || driveRes.url
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Gagal membagikan gambar: ${err?.message || 'Error'}`
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Salin gambar nota ke clipboard (Ctrl+V di WhatsApp Web)
  const handleCopyNotaImageToClipboard = async () => {
    setIsProcessingImage(true);
    try {
      const result = await generateNotaCanvas();
      if (!result) return;
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': result.blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      }
    } catch (err) {
      console.warn('Gagal salin gambar:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Klik tombol Konfirmasi Order: langsung membuka nomor WhatsApp Customer dengan pesan rincian lengkap
  const handleConfirmOrderWhatsApp = () => {
    if (userRole === 'admin') {
      const customerRawPhone = findCustomerPhone(order, users);
      const destPhone = cleanWhatsAppPhone(customerRawPhone);

      if (!destPhone) {
        alert(
          'Nomor WhatsApp customer tidak ditemukan. Mohon periksa kembali nomor kontak customer pada data transaksi ini.'
        );
        return;
      }

      const message = formatOrderWhatsAppConfirmation(order, storeData, orderItems);
      const waUrl = createWhatsAppUrl(destPhone, message);
      window.open(waUrl, '_blank');
    } else {
      // Tampilan Customer: Menghubungi CS Toko
      const csPhone = cleanWhatsAppPhone(storeData.kontak || '085815950700');
      const message = formatCustomerToAdminWhatsAppConfirmation(order, storeData, orderItems);
      const waUrl = createWhatsAppUrl(csPhone, message);
      window.open(waUrl, '_blank');
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TAMPILAN MODAL INTERAKTIF DI LAYAR (SEMBUNYI SAAT CETAK) */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:hidden">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header Modal */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-start justify-between relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-teal-100">
                  Rincian Transaksi
                </span>
                <span className="text-[10px] font-mono text-teal-200">
                  {order.ID}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                {displayItems.length > 1
                  ? `${order.NamaCustomer} (${displayItems.length} Produk)`
                  : (displayItems[0]?.namaProduk || order.NamaProduk)}
              </h3>
              <p className="text-[11px] text-teal-200 mt-0.5">
                {formatDate(order.Tgl)}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-slate-700">
            {/* Branded Store Info Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {storeData.logo_url ? (
                  <img
                    src={storeData.logo_url}
                    alt={storeData.nama_toko || 'Alinea Desain'}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    {(storeData.nama_toko?.slice(0, 2) || 'AD').toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    {storeData.nama_toko || 'Alinea Desain'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {storeData.tagline || 'Solusi Desain & Cetak Anda'}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <div className="font-semibold">WA: {storeData.kontak}</div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold mb-1">
                  Status Produksi
                </div>
                {getStatusBadge(order.StatusOrder)}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold mb-1">
                  Status Pembayaran
                </div>
                {getBayarBadge(order.StatusBayar)}
              </div>
            </div>

            {/* Customer info */}
            <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-1.5">
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Nama Customer:</span>
                <span className="font-bold text-slate-900">{order.NamaCustomer}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>ID Khusus Customer:</span>
                <span className="font-mono font-bold text-teal-800">{order.KodeCustomer || '-'}</span>
              </div>
              {order.NoCustomer && (
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span>WhatsApp:</span>
                  <span className="font-semibold text-slate-800 font-mono">{String(order.NoCustomer)}</span>
                </div>
              )}
            </div>

            {/* RINCIAN SETIAP PRODUK YANG DIPESAN (Mendukung Satuan & Multi-Item) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Rincian Tiap Produk ({displayItems.length} Item)
                </h4>
              </div>

              <div className="space-y-2.5">
                {displayItems.map((item, idx) => {
                  const itemIsMeteran = item.kategori === 'meteran' || ((item.panjang || 0) > 0 && (item.lebar || 0) > 0);
                  const itemLuas = itemIsMeteran && item.panjang && item.lebar
                    ? Math.max(1, ((item.panjang / 100) * (item.lebar / 100)))
                    : 0;

                  return (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/90 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.namaProduk}</span>
                        </div>
                        <span className="text-teal-700 font-extrabold text-sm shrink-0">
                          {formatRp(item.subtotal)}
                        </span>
                      </div>

                      {/* Detail Spesifikasi Item */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">Jumlah (Qty):</span>{' '}
                          <strong className="text-slate-800">{item.qty} pcs</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Harga Satuan:</span>{' '}
                          <span>{formatRp(item.harga)}</span>
                        </div>

                        {itemIsMeteran && item.panjang && item.lebar && (
                          <>
                            <div className="col-span-2">
                              <span className="text-slate-400">Ukuran Cetak:</span>{' '}
                              <strong className="text-slate-800">
                                {item.panjang} x {item.lebar} cm ({itemLuas.toFixed(2)} m²)
                              </strong>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Finishing:</span>{' '}
                              <span className="font-semibold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded text-[10px]">
                                {item.finishing || 'Simkel'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Layanan Tambahan per Item */}
                      {(item.withDesain || item.withCutting || item.withLaminating || item.withJasaLain || (item.jasaDesain || 0) > 0 || (item.jasaCutting || 0) > 0 || (item.jasaLaminating || 0) > 0 || (item.jasaLain || 0) > 0) && (
                        <div className="pt-1.5 border-t border-dashed border-slate-200 text-[10px] space-y-0.5 text-slate-500">
                          {(item.withDesain || (item.jasaDesain || 0) > 0) && (
                            <div className="flex justify-between">
                              <span>+ Jasa Desain:</span>
                              <span className="font-semibold text-teal-700">{formatRp(item.jasaDesain || 0)}</span>
                            </div>
                          )}
                          {(item.withCutting || (item.jasaCutting || 0) > 0) && (
                            <div className="flex justify-between">
                              <span>+ Jasa Cutting Presisi:</span>
                              <span className="font-semibold text-teal-700">{formatRp(item.jasaCutting || 0)}</span>
                            </div>
                          )}
                          {(item.withLaminating || (item.jasaLaminating || 0) > 0) && (
                            <div className="flex justify-between">
                              <span>+ Jasa Laminating:</span>
                              <span className="font-semibold text-teal-700">{formatRp(item.jasaLaminating || 0)}</span>
                            </div>
                          )}
                          {(item.withJasaLain || (item.jasaLain || 0) > 0) && (
                            <div className="flex justify-between">
                              <span>+ {item.namaJasaLain || 'Jasa Lain'}:</span>
                              <span className="font-semibold text-teal-700">{formatRp(item.jasaLain || 0)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rincian Tagihan & Pembayaran */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Rincian Tagihan & Pembayaran
              </h4>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <span>Total Tagihan:</span>
                  <span className="text-teal-700 text-base font-extrabold">
                    {formatRp(order.TotalHarga)}
                  </span>
                </div>

                {/* Status Pembayaran & DP */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {dpAmount > 0 && (
                    <div className="flex justify-between items-center text-teal-800">
                      <span>Uang Muka (DP) Masuk:</span>
                      <span className="font-bold">{formatRp(dpAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Sisa Tagihan:</span>
                    <span
                      className={`font-extrabold text-sm ${
                        sisaTagihan <= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {sisaTagihan <= 0 ? 'LUNAS' : formatRp(sisaTagihan)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan Order */}
            {order.Catatan && (
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Catatan Pemesanan
                </h4>
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 leading-relaxed">
                  {order.Catatan}
                </div>
              </div>
            )}

            {/* Lampiran Desain / Gambar Referensi */}
            {order.FileDesain && (
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Lampiran Desain / Foto (PNG, JPG, WEBP)
                </h4>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex items-center gap-3">
                  <img
                    src={order.FileDesain}
                    alt="File Desain"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">File Referensi Desain / Foto</span>
                    <a
                      href={order.FileDesain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 font-semibold hover:underline text-[11px]"
                    >
                      Buka Gambar Penuh ↗
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Rekening Pembayaran Toko (Mendukung Multi-Rekening Bank & E-Wallet) */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Info Rekening Pembayaran / Transfer</span>
                </div>
                {normalizedBankAccounts.length <= 1 && (
                  <button
                    type="button"
                    onClick={() => handleCopyRekening(normalizedBankAccounts[0]?.nomor || storeData.rekening)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedRekening ? (
                      <>
                        <Check className="w-3 h-3 text-teal-400" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Salin No. Rekening
                      </>
                    )}
                  </button>
                )}
              </div>

              {normalizedBankAccounts.length > 0 ? (
                <div className="space-y-2">
                  {normalizedBankAccounts.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-teal-300 text-xs">{b.bank}</span>
                          {b.isPrimary && (
                            <span className="text-[9px] bg-teal-900 text-teal-200 px-1.5 py-0.5 rounded font-semibold border border-teal-700">
                              Utama
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] font-mono font-bold text-white tracking-wide mt-0.5">
                          {b.nomor}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          a.n {b.atasNama}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyRekening(b.nomor, b.id)}
                        className="bg-slate-700 hover:bg-teal-700 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shrink-0"
                      >
                        {copiedBankId === b.id ? (
                          <>
                            <Check className="w-3 h-3 text-teal-300" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin No.</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800 p-2.5 rounded-xl font-mono text-teal-300 text-xs">
                  {storeData.rekening || 'CIMB Niaga 763568966600 a.n Muhammad Rosyid Ridlo'}
                </div>
              )}

              <p className="text-[10px] text-slate-400 italic">
                *Silakan transfer sesuai sisa tagihan dan kirimkan bukti transfer melalui WhatsApp.
              </p>
            </div>
          </div>

          {/* Feedback Banner: Sukses Simpan / Share Gambar */}
          {feedbackMessage && (
            <div className={`mx-4 mb-2 p-3 rounded-2xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
              {feedbackMessage.driveUrl && (
                <a
                  href={feedbackMessage.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 shrink-0"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Lihat di Drive</span>
                </a>
              )}
            </div>
          )}

          {/* Pengaturan Media Cetak & Tombol Aksi Lengkap */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
            {/* Pilihan Media Cetak (A4 Pas 1 Halaman, Thermal Struk, A5) */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 pl-1">
                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                <span>Media Cetak:</span>
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPrintMedia('a4')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    printMedia === 'a4'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ukuran A4/F4 Pas 1 Halaman"
                >
                  A4 Pas (1 Halaman)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMedia('thermal')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    printMedia === 'thermal'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ukuran Struk Kasir Gulung 58mm / 80mm"
                >
                  Thermal (Struk)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMedia('a5')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    printMedia === 'a5'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ukuran Ringkas Setengah Halaman"
                >
                  A5 Ringkas
                </button>
              </div>
            </div>

            {/* Baris Tombol Simpan & Share Gambar Nota */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadNotaImage}
                disabled={isProcessingImage}
                className="bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 font-bold py-2 px-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Download gambar nota (PNG) dan otomatis simpan ke Google Drive"
              >
                {isProcessingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                )}
                <span>Simpan Gambar</span>
              </button>

              <button
                type="button"
                onClick={handleShareNotaImage}
                disabled={isProcessingImage}
                className="bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 font-bold py-2 px-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Bagikan gambar nota via Web Share / link WhatsApp ke customer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share Gambar</span>
              </button>

              <button
                type="button"
                onClick={handleCopyNotaImageToClipboard}
                disabled={isProcessingImage}
                className="bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 font-bold py-2 px-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Salin gambar nota ke clipboard (langsung Ctrl+V di WA Web)"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Gambar</span>
                  </>
                )}
              </button>
            </div>

            {/* Baris Tombol Utama: Kirim Pesan WA & Cetak Nota (Print) */}
            <div className="flex items-center gap-2 pt-1">
              {userRole === 'admin' ? (
                <button
                  type="button"
                  onClick={handleConfirmOrderWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                  title="Kirim rincian nota pesanan ke WhatsApp customer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Pesan ke WA</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmOrderWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat CS & Konfirmasi</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-teal-800 hover:bg-teal-900 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-teal-900/20"
                title="Cetak Nota 1 Halaman Pas sesuai media yang dipilih"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DOKUMEN CETAK NOTA RESMI (HANYA MUNCUL SAAT WINDOW.PRINT) */}
      {/* Sesuai Permintaan: FIT 1 HALAMAN PAS & MENYESUAIKAN MEDIA */}
      {/* ======================================================== */}
      <div
        id="printable-nota-root"
        className={`hidden print:block font-sans text-black mx-auto print-avoid-break ${
          printMedia === 'thermal'
            ? 'max-w-[380px] p-2 text-[10px]'
            : printMedia === 'a5'
            ? 'max-w-[600px] p-3 text-[11px]'
            : 'max-w-[760px] p-4 text-xs'
        }`}
      >
        {/* Header Nota */}
        <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-start">
          <div className="space-y-0.5">
            <h1 className="text-lg font-black uppercase tracking-wider leading-tight">
              {storeData.nama_toko || 'ALINEA DESAIN'}
            </h1>
            <p className="text-[11px] text-gray-700">
              {storeData.tagline || 'Percetakan & Digital Printing Cepat Berkualitas'}
            </p>
            <p className="text-[10px] text-gray-600 max-w-sm">
              {storeData.alamat}
            </p>
            <p className="text-[10px] font-bold text-gray-800">
              WhatsApp CS: {storeData.kontak}
            </p>
          </div>
          <div className="text-right shrink-0">
            <h2 className="text-base font-black tracking-wide border-b-2 border-black pb-0.5 inline-block">
              NOTA PESANAN
            </h2>
            <div className="text-[11px] mt-1 space-y-0.5">
              <div>No: <strong>{order.ID}</strong></div>
              <div>Tgl: {formatDate(order.Tgl)}</div>
            </div>
          </div>
        </div>

        {/* Informasi Customer (Grid Ramping 4 Kolom) */}
        <div className="bg-gray-50 border border-gray-300 rounded p-2 mb-3 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-gray-500 block text-[9px] uppercase">Nama Customer</span>
            <strong className="text-black uppercase">{order.NamaCustomer}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-[9px] uppercase">No. WhatsApp</span>
            <strong className="text-black">{String(order.NoCustomer || '-')}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-[9px] uppercase">ID Customer</span>
            <strong className="text-black">{order.KodeCustomer || '-'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block text-[9px] uppercase">Status Pembayaran</span>
            <strong className="text-black uppercase font-bold">{order.StatusBayar}</strong>
          </div>
        </div>

        {/* Tabel Detail Tiap Produk (Borders Bersih, Padding Kompak 1 Halaman) */}
        <table className="w-full text-[11px] border-collapse border border-gray-400 mb-3">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="border border-gray-400 py-1.5 px-2 text-center w-8">No</th>
              <th className="border border-gray-400 py-1.5 px-2 text-left">Nama Produk & Spesifikasi</th>
              <th className="border border-gray-400 py-1.5 px-2 text-center w-14">Qty</th>
              <th className="border border-gray-400 py-1.5 px-2 text-right w-24">Harga Satuan</th>
              <th className="border border-gray-400 py-1.5 px-2 text-right w-24">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => {
              const itemIsMeteran = item.kategori === 'meteran' || ((item.panjang || 0) > 0 && (item.lebar || 0) > 0);
              const itemLuas = itemIsMeteran && item.panjang && item.lebar
                ? Math.max(1, ((item.panjang / 100) * (item.lebar / 100)))
                : 0;

              return (
                <tr key={item.id || idx}>
                  <td className="border border-gray-400 py-1.5 px-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-gray-400 py-1.5 px-2">
                    <div className="font-bold">{item.namaProduk}</div>
                    {itemIsMeteran && item.panjang && item.lebar && (
                      <div className="text-[9px] text-gray-600">
                        Ukuran: {item.panjang} x {item.lebar} cm ({itemLuas.toFixed(2)} m²) • Finishing: {item.finishing || 'Simkel'}
                      </div>
                    )}
                    {(item.withDesain || item.withCutting || item.withLaminating || item.withJasaLain || (item.jasaDesain || 0) > 0 || (item.jasaCutting || 0) > 0 || (item.jasaLaminating || 0) > 0 || (item.jasaLain || 0) > 0) && (
                      <div className="text-[9px] text-gray-600 italic">
                        Layanan: {[
                          (item.withDesain || (item.jasaDesain || 0) > 0) ? `Desain (${formatRp(item.jasaDesain || 0)})` : '',
                          (item.withCutting || (item.jasaCutting || 0) > 0) ? `Cutting (${formatRp(item.jasaCutting || 0)})` : '',
                          (item.withLaminating || (item.jasaLaminating || 0) > 0) ? `Laminasi (${formatRp(item.jasaLaminating || 0)})` : '',
                          (item.withJasaLain || (item.jasaLain || 0) > 0) ? `${item.namaJasaLain || 'Jasa Lain'} (${formatRp(item.jasaLain || 0)})` : ''
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 text-center">{item.qty} pcs</td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right">{formatRp(item.harga)}</td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right font-bold">{formatRp(item.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Ringkasan Pembayaran & Rekening */}
        <div className="flex justify-between items-start gap-3 mb-4 text-[11px]">
          <div className="w-1/2 space-y-1.5">
            {order.Catatan && (
              <div className="border border-gray-300 p-2 rounded bg-gray-50 text-[10px]">
                <strong>Catatan:</strong> {order.Catatan}
              </div>
            )}
            <div className="border border-gray-300 p-2 rounded bg-gray-50 text-[10px]">
              <div><strong>Rekening Pembayaran:</strong></div>
              {normalizedBankAccounts.length > 0 ? (
                <div className="space-y-0.5 mt-0.5 font-mono">
                  {normalizedBankAccounts.map((b) => (
                    <div key={b.id}>
                      • <strong>{b.bank}:</strong> {b.nomor} (a.n {b.atasNama})
                    </div>
                  ))}
                </div>
              ) : (
                <div>{storeData.rekening}</div>
              )}
            </div>
          </div>

          <div className="w-1/2">
            <div className="border border-gray-400 p-2 rounded space-y-1">
              <div className="flex justify-between font-bold text-xs border-b border-gray-300 pb-1">
                <span>TOTAL:</span>
                <span>{formatRp(order.TotalHarga)}</span>
              </div>
              {dpAmount > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Uang Muka (DP):</span>
                  <span>{formatRp(dpAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                <span>SISA TAGIHAN:</span>
                <span className={sisaTagihan <= 0 ? 'text-green-700' : 'text-red-700'}>
                  {sisaTagihan <= 0 ? 'LUNAS' : formatRp(sisaTagihan)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tanda Tangan (Tinggi Kompak Menjaga 1 Halaman Pas) */}
        <div className="grid grid-cols-2 text-center text-[10px] mt-4 pt-2">
          <div>
            <p className="mb-8">Tanda Terima Customer,</p>
            <p className="border-t border-black inline-block px-6 pt-1 font-bold">({order.NamaCustomer})</p>
          </div>
          <div>
            <p className="mb-8">Kasir / Hormat Kami,</p>
            <p className="border-t border-black inline-block px-6 pt-1 font-bold">({storeData.nama_toko || 'Alinea Desain'})</p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DOKUMEN OFF-SCREEN UNTUK CAPTURE GAMBAR BERESOLUSI TINGGI */}
      {/* Digunakan khusus oleh html2canvas agar selalu pixel-perfect */}
      {/* ======================================================== */}
      <div
        ref={captureNotaRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '760px',
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: -100
        }}
      >
        {/* Header Nota Gambar */}
        <div style={{ borderBottom: '2px solid #000000', paddingBottom: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              {storeData.nama_toko || 'ALINEA DESAIN'}
            </h1>
            <p style={{ fontSize: '11px', color: '#4b5563', margin: '3px 0 0 0' }}>
              {storeData.tagline || 'Percetakan & Digital Printing Cepat Berkualitas'}
            </p>
            <p style={{ fontSize: '10px', color: '#6b7280', margin: '3px 0 0 0', maxWidth: '380px' }}>
              {storeData.alamat}
            </p>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#1f2937', margin: '3px 0 0 0' }}>
              WhatsApp CS: {storeData.kontak}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.5px', borderBottom: '2px solid #000000', paddingBottom: '2px', display: 'inline-block', margin: 0 }}>
              NOTA PESANAN
            </h2>
            <div style={{ fontSize: '11px', marginTop: '6px' }}>
              <div>No: <strong>{order.ID}</strong></div>
              <div>Tgl: {formatDate(order.Tgl)}</div>
            </div>
          </div>
        </div>

        {/* Customer Bar */}
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '11px' }}>
          <div>
            <span style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>Nama Customer</span>
            <strong style={{ textTransform: 'uppercase' }}>{order.NamaCustomer}</strong>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>No. WhatsApp</span>
            <strong>{String(order.NoCustomer || '-')}</strong>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>ID Customer</span>
            <strong>{order.KodeCustomer || '-'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', display: 'block' }}>Status Bayar</span>
            <strong style={{ textTransform: 'uppercase' }}>{order.StatusBayar}</strong>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', border: '1px solid #9ca3af', marginBottom: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'center', width: '30px' }}>No</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'left' }}>Nama Produk & Spesifikasi</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'center', width: '50px' }}>Qty</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right', width: '100px' }}>Harga Satuan</th>
              <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right', width: '100px' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => {
              const itemIsMeteran = item.kategori === 'meteran' || ((item.panjang || 0) > 0 && (item.lebar || 0) > 0);
              const itemLuas = itemIsMeteran && item.panjang && item.lebar
                ? Math.max(1, ((item.panjang / 100) * (item.lebar / 100)))
                : 0;

              return (
                <tr key={item.id || idx}>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.namaProduk}</div>
                    {itemIsMeteran && item.panjang && item.lebar && (
                      <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '2px' }}>
                        Ukuran: {item.panjang} x {item.lebar} cm ({itemLuas.toFixed(2)} m²) • Finishing: {item.finishing || 'Simkel'}
                      </div>
                    )}
                    {(item.withDesain || item.withCutting || item.withLaminating || item.withJasaLain || (item.jasaDesain || 0) > 0 || (item.jasaCutting || 0) > 0 || (item.jasaLaminating || 0) > 0 || (item.jasaLain || 0) > 0) && (
                      <div style={{ fontSize: '9px', color: '#4b5563', fontStyle: 'italic', marginTop: '2px' }}>
                        Layanan: {[
                          (item.withDesain || (item.jasaDesain || 0) > 0) ? `Desain (${formatRp(item.jasaDesain || 0)})` : '',
                          (item.withCutting || (item.jasaCutting || 0) > 0) ? `Cutting (${formatRp(item.jasaCutting || 0)})` : '',
                          (item.withLaminating || (item.jasaLaminating || 0) > 0) ? `Laminasi (${formatRp(item.jasaLaminating || 0)})` : '',
                          (item.withJasaLain || (item.jasaLain || 0) > 0) ? `${item.namaJasaLain || 'Jasa Lain'} (${formatRp(item.jasaLain || 0)})` : ''
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'center' }}>{item.qty} pcs</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right' }}>{formatRp(item.harga)}</td>
                  <td style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{formatRp(item.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', fontSize: '11px' }}>
          <div style={{ width: '50%' }}>
            {order.Catatan && (
              <div style={{ border: '1px solid #d1d5db', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#f9fafb', marginBottom: '6px', fontSize: '10px' }}>
                <strong>Catatan:</strong> {order.Catatan}
              </div>
            )}
            <div style={{ border: '1px solid #d1d5db', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#f9fafb', fontSize: '10px' }}>
              <div><strong>Rekening Pembayaran:</strong></div>
              {normalizedBankAccounts.length > 0 ? (
                <div style={{ marginTop: '2px', fontFamily: 'monospace' }}>
                  {normalizedBankAccounts.map((b) => (
                    <div key={b.id}>
                      • <strong>{b.bank}:</strong> {b.nomor} (a.n {b.atasNama})
                    </div>
                  ))}
                </div>
              ) : (
                <div>{storeData.rekening}</div>
              )}
            </div>
          </div>

          <div style={{ width: '50%' }}>
            <div style={{ border: '1px solid #9ca3af', padding: '8px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                <span>TOTAL:</span>
                <span>{formatRp(order.TotalHarga)}</span>
              </div>
              {dpAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
                  <span>Uang Muka (DP):</span>
                  <span>{formatRp(dpAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '4px', borderTop: '1px solid #e5e7eb', paddingTop: '4px' }}>
                <span>SISA TAGIHAN:</span>
                <span style={{ color: sisaTagihan <= 0 ? '#15803d' : '#b91c1c' }}>
                  {sisaTagihan <= 0 ? 'LUNAS' : formatRp(sisaTagihan)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', fontSize: '10px', marginTop: '16px', paddingTop: '8px' }}>
          <div>
            <p style={{ marginBottom: '36px' }}>Tanda Terima Customer,</p>
            <p style={{ borderTop: '1px solid #000000', display: 'inline-block', padding: '2px 24px 0 24px', fontWeight: 'bold' }}>({order.NamaCustomer})</p>
          </div>
          <div>
            <p style={{ marginBottom: '36px' }}>Kasir / Hormat Kami,</p>
            <p style={{ borderTop: '1px solid #000000', display: 'inline-block', padding: '2px 24px 0 24px', fontWeight: 'bold' }}>({storeData.nama_toko || 'Alinea Desain'})</p>
          </div>
        </div>
      </div>
    </>
  );
};
