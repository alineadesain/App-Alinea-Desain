import React, { useState } from 'react';
import {
  X,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Ruler,
  Scissors,
  Palette,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import { Order, StoreData, User } from '../types';
import {
  findCustomerPhone,
  cleanWhatsAppPhone,
  formatOrderWhatsAppConfirmation,
  formatCustomerToAdminWhatsAppConfirmation,
  createWhatsAppUrl
} from '../utils/whatsappFormatter';

interface OrderDetailModalProps {
  order: Order | null;
  storeData: StoreData;
  onClose: () => void;
  users?: User[];
  userRole?: 'admin' | 'customer';
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  storeData,
  onClose,
  users = [],
  userRole = 'customer'
}) => {
  const [copiedRekening, setCopiedRekening] = useState(false);

  if (!order) return null;

  const formatRp = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
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

  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  const handleCopyRekening = (textToCopy?: string, bankId?: string) => {
    const text = textToCopy || storeData.rekening;
    if (text) {
      navigator.clipboard.writeText(text);
      if (bankId) {
        setCopiedBankId(bankId);
        setTimeout(() => setCopiedBankId(null), 2000);
      } else {
        setCopiedRekening(true);
        setTimeout(() => setCopiedRekening(false), 2000);
      }
    }
  };

  const dpAmount = order.NominalDP || order.DP || 0;
  const sisaTagihan =
    order.SisaTagihan !== undefined
      ? order.SisaTagihan
      : Math.max(0, order.TotalHarga - dpAmount);

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

      const message = formatOrderWhatsAppConfirmation(order, storeData);
      const waUrl = createWhatsAppUrl(destPhone, message);
      window.open(waUrl, '_blank');
    } else {
      // Tampilan Customer: Menghubungi CS Toko
      const csPhone = cleanWhatsAppPhone(storeData.kontak || '085815950700');
      const message = formatCustomerToAdminWhatsAppConfirmation(order, storeData);
      const waUrl = createWhatsAppUrl(csPhone, message);
      window.open(waUrl, '_blank');
    }
  };

  const isMeteran = order.Kategori === 'meteran';
  const luasM2 = isMeteran
    ? Math.max(1, ((order.Panjang || 100) / 100) * ((order.Lebar || 100) / 100))
    : 0;

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TAMPILAN MODAL INTERAKTIF DI LAYAR (SEMBUNYI SAAT CETAK) */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:hidden">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header Modal */}
          <div className="bg-linear-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-start justify-between relative">
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
                {order.Items && order.Items.length > 1
                  ? `${order.NamaCustomer} (${order.Items.length} Produk)`
                  : order.NamaProduk}
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
                  <span className="font-semibold text-slate-800 font-mono">{order.NoCustomer}</span>
                </div>
              )}
            </div>

            {/* RINCIAN SETIAP PRODUK YANG DIPESAN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Rincian Tiap Produk ({order.Items?.length || 1} Item)
                </h4>
              </div>

              {order.Items && order.Items.length > 0 ? (
                <div className="space-y-2.5">
                  {order.Items.map((item, idx) => {
                    const itemIsMeteran = item.kategori === 'meteran';
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
                        {(item.withDesain || item.withCutting || item.withLaminating) && (
                          <div className="pt-1.5 border-t border-dashed border-slate-200 text-[10px] space-y-0.5 text-slate-500">
                            {item.withDesain && (
                              <div className="flex justify-between">
                                <span>+ Jasa Desain:</span>
                                <span className="font-semibold text-teal-700">{formatRp(item.jasaDesain || 0)}</span>
                              </div>
                            )}
                            {item.withCutting && (
                              <div className="flex justify-between">
                                <span>+ Jasa Cutting Presisi:</span>
                                <span className="font-semibold text-teal-700">{formatRp(item.jasaCutting || 0)}</span>
                              </div>
                            )}
                            {item.withLaminating && (
                              <div className="flex justify-between">
                                <span>+ Jasa Laminating:</span>
                                <span className="font-semibold text-teal-700">{formatRp(item.jasaLaminating || 0)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single Product Order Fallback */
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-xs">
                      1. {order.NamaProduk}
                    </span>
                    <span className="font-extrabold text-teal-700 text-sm">
                      {formatRp(order.TotalHarga)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Kategori:</span>{' '}
                      <span className="capitalize font-semibold">{order.Kategori}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Qty:</span>{' '}
                      <strong className="text-slate-800">{order.Qty} pcs</strong>
                    </div>

                    {isMeteran && (
                      <>
                        <div className="col-span-2">
                          <span className="text-slate-400">Ukuran:</span>{' '}
                          <strong className="text-slate-800">
                            {order.Panjang} x {order.Lebar} cm ({luasM2.toFixed(2)} m²)
                          </strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Finishing:</span>{' '}
                          <span className="font-semibold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded text-[10px]">
                            {order.Finishing || 'Tanpa Finishing'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {((order.JasaDesain || 0) > 0 || (order.JasaCutting || 0) > 0 || (order.JasaLaminating || 0) > 0) && (
                    <div className="pt-1.5 border-t border-dashed border-slate-200 text-[10px] space-y-0.5 text-slate-500">
                      {(order.JasaDesain || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>+ Jasa Desain:</span>
                          <span className="font-semibold text-teal-700">{formatRp(order.JasaDesain || 0)}</span>
                        </div>
                      )}
                      {(order.JasaCutting || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>+ Jasa Cutting:</span>
                          <span className="font-semibold text-teal-700">{formatRp(order.JasaCutting || 0)}</span>
                        </div>
                      )}
                      {(order.JasaLaminating || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>+ Jasa Laminating:</span>
                          <span className="font-semibold text-teal-700">{formatRp(order.JasaLaminating || 0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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

            {/* Catatan Tambahan jika ada */}
            {order.Catatan && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <span className="font-bold text-[11px] block">Catatan Pesanan:</span>
                <p className="text-[11px] italic leading-relaxed">
                  "{order.Catatan}"
                </p>
              </div>
            )}

            {/* Rekening Pembayaran Toko */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Info Rekening Pembayaran / Transfer</span>
                </div>
                {(!storeData.bank_accounts || storeData.bank_accounts.length <= 1) && (
                  <button
                    type="button"
                    onClick={() => handleCopyRekening(storeData.bank_accounts?.[0]?.nomor || storeData.rekening)}
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

              {storeData.bank_accounts && storeData.bank_accounts.length > 0 ? (
                <div className="space-y-2">
                  {storeData.bank_accounts.map((b) => (
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
                <div className="text-[11px] text-slate-300 font-mono bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  {storeData.rekening || 'CIMB Niaga 763568966600 a.n Muhammad Rosyid Ridlo'}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions: Tombol Konfirmasi Order & Cetak */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            {userRole === 'admin' ? (
              <button
                type="button"
                onClick={handleConfirmOrderWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Konfirmasi Order</span>
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
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 px-3.5 rounded-xl text-xs flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
              title="Cetak Nota Pesanan"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DOKUMEN CETAK NOTA RESMI (HANYA MUNCUL SAAT WINDOW.PRINT) */}
      {/* ======================================================== */}
      <div className="hidden print:block font-sans text-black p-4 max-w-3xl mx-auto">
        {/* Header Nota */}
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider">
              {storeData.nama_toko || 'ALINEA DESAIN'}
            </h1>
            <p className="text-xs text-gray-700">
              {storeData.tagline || 'Percetakan & Digital Printing Cepat Berkualitas'}
            </p>
            <p className="text-[11px] text-gray-600 mt-1 max-w-md">
              {storeData.alamat}
            </p>
            <p className="text-[11px] font-bold text-gray-800">
              WhatsApp CS: {storeData.kontak}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black tracking-wide border-b-2 border-black pb-0.5 inline-block">
              NOTA PESANAN
            </h2>
            <div className="text-xs mt-1.5 space-y-0.5">
              <div>No: <strong>{order.ID}</strong></div>
              <div>Tgl: {formatDate(order.Tgl)}</div>
            </div>
          </div>
        </div>

        {/* Informasi Customer */}
        <div className="bg-gray-50 border border-gray-300 rounded p-2.5 mb-4 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-500">Nama Customer:</span>{' '}
            <strong className="text-black uppercase">{order.NamaCustomer}</strong>
          </div>
          <div>
            <span className="text-gray-500">No. WhatsApp:</span>{' '}
            <strong className="text-black">{order.NoCustomer || '-'}</strong>
          </div>
          <div>
            <span className="text-gray-500">ID Customer:</span>{' '}
            <strong className="text-black">{order.KodeCustomer || '-'}</strong>
          </div>
          <div>
            <span className="text-gray-500">Status Pembayaran:</span>{' '}
            <strong className="text-black uppercase">{order.StatusBayar}</strong>
          </div>
        </div>

        {/* Tabel Detail Tiap Produk */}
        <table className="w-full text-xs border-collapse border border-gray-400 mb-4">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="border border-gray-400 p-2 text-center w-10">No</th>
              <th className="border border-gray-400 p-2 text-left">Nama Produk & Spesifikasi</th>
              <th className="border border-gray-400 p-2 text-center w-16">Qty</th>
              <th className="border border-gray-400 p-2 text-right w-28">Harga Satuan</th>
              <th className="border border-gray-400 p-2 text-right w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.Items && order.Items.length > 0 ? (
              order.Items.map((item, idx) => {
                const itemIsMeteran = item.kategori === 'meteran';
                const itemLuas = itemIsMeteran && item.panjang && item.lebar
                  ? Math.max(1, ((item.panjang / 100) * (item.lebar / 100)))
                  : 0;

                return (
                  <tr key={item.id || idx}>
                    <td className="border border-gray-400 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-gray-400 p-2">
                      <div className="font-bold">{item.namaProduk}</div>
                      {itemIsMeteran && item.panjang && item.lebar && (
                        <div className="text-[10px] text-gray-600">
                          Ukuran: {item.panjang} x {item.lebar} cm ({itemLuas.toFixed(2)} m²) • Finishing: {item.finishing || 'Simkel'}
                        </div>
                      )}
                      {(item.withDesain || item.withCutting || item.withLaminating) && (
                        <div className="text-[10px] text-gray-600 italic">
                          Layanan: {[
                            item.withDesain ? `Desain (${formatRp(item.jasaDesain || 0)})` : '',
                            item.withCutting ? `Cutting (${formatRp(item.jasaCutting || 0)})` : '',
                            item.withLaminating ? `Laminasi (${formatRp(item.jasaLaminating || 0)})` : ''
                          ].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-400 p-2 text-center">{item.qty} pcs</td>
                    <td className="border border-gray-400 p-2 text-right">{formatRp(item.harga)}</td>
                    <td className="border border-gray-400 p-2 text-right font-bold">{formatRp(item.subtotal)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="border border-gray-400 p-2 text-center font-bold">1</td>
                <td className="border border-gray-400 p-2">
                  <div className="font-bold">{order.NamaProduk}</div>
                  {isMeteran && (
                    <div className="text-[10px] text-gray-600">
                      Ukuran: {order.Panjang} x {order.Lebar} cm ({luasM2.toFixed(2)} m²) • Finishing: {order.Finishing || 'Tanpa Finishing'}
                    </div>
                  )}
                  {((order.JasaDesain || 0) > 0 || (order.JasaCutting || 0) > 0 || (order.JasaLaminating || 0) > 0) && (
                    <div className="text-[10px] text-gray-600 italic">
                      Layanan: {[
                        (order.JasaDesain || 0) > 0 ? `Desain (${formatRp(order.JasaDesain)})` : '',
                        (order.JasaCutting || 0) > 0 ? `Cutting (${formatRp(order.JasaCutting)})` : '',
                        (order.JasaLaminating || 0) > 0 ? `Laminasi (${formatRp(order.JasaLaminating)})` : ''
                      ].filter(Boolean).join(', ')}
                    </div>
                  )}
                </td>
                <td className="border border-gray-400 p-2 text-center">{order.Qty} pcs</td>
                <td className="border border-gray-400 p-2 text-right">
                  {formatRp(order.TotalHarga - (order.JasaDesain || 0) - (order.JasaCutting || 0) - (order.JasaLaminating || 0))}
                </td>
                <td className="border border-gray-400 p-2 text-right font-bold">{formatRp(order.TotalHarga)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Ringkasan Pembayaran & Rekening */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="w-1/2 text-xs space-y-2">
            {order.Catatan && (
              <div className="border border-gray-300 p-2 rounded">
                <strong>Catatan:</strong> {order.Catatan}
              </div>
            )}
            <div className="border border-gray-300 p-2 rounded bg-gray-50 text-[11px]">
              <div><strong>Rekening Pembayaran:</strong></div>
              {storeData.bank_accounts && storeData.bank_accounts.length > 0 ? (
                <div className="space-y-0.5 mt-1 font-mono">
                  {storeData.bank_accounts.map((b) => (
                    <div key={b.id}>
                      • <strong>{b.bank}:</strong> {b.nomor} (a.n {b.atasNama}) {b.isPrimary ? '★' : ''}
                    </div>
                  ))}
                </div>
              ) : (
                <div>{storeData.rekening}</div>
              )}
            </div>
          </div>

          <div className="w-1/2 text-xs">
            <div className="border border-gray-400 p-2.5 rounded space-y-1.5">
              <div className="flex justify-between font-bold text-sm border-b border-gray-300 pb-1">
                <span>TOTAL:</span>
                <span>{formatRp(order.TotalHarga)}</span>
              </div>
              {dpAmount > 0 && (
                <div className="flex justify-between">
                  <span>Uang Muka (DP):</span>
                  <span>{formatRp(dpAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                <span>SISA TAGIHAN:</span>
                <span className={sisaTagihan <= 0 ? 'text-green-700' : 'text-red-700'}>
                  {sisaTagihan <= 0 ? 'LUNAS' : formatRp(sisaTagihan)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 text-center text-xs mt-8 pt-4">
          <div>
            <p className="mb-14">Tanda Terima Customer,</p>
            <p className="border-t border-black inline-block px-8 pt-1">({order.NamaCustomer})</p>
          </div>
          <div>
            <p className="mb-14">Kasir / Hormat Kami,</p>
            <p className="border-t border-black inline-block px-8 pt-1">({storeData.nama_toko || 'Alinea Desain'})</p>
          </div>
        </div>
      </div>
    </>
  );
};
