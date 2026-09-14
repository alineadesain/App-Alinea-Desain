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
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { Order, StoreData } from '../types';

interface OrderDetailModalProps {
  order: Order | null;
  storeData: StoreData;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  storeData,
  onClose
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

  const handleCopyRekening = () => {
    if (storeData.rekening) {
      navigator.clipboard.writeText(storeData.rekening);
      setCopiedRekening(true);
      setTimeout(() => setCopiedRekening(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const rawNo = (storeData.kontak || '081234567890').replace(/[^0-9]/g, '');
    const phone = rawNo.startsWith('0') ? '62' + rawNo.slice(1) : rawNo;

    const message = encodeURIComponent(
      `Halo Alinea Desain, saya ingin konfirmasi pesanan saya:\n\n` +
      `📌 *No. Order:* ${order.ID}\n` +
      `👤 *Nama:* ${order.NamaCustomer} (ID: ${order.KodeCustomer})\n` +
      `📦 *Produk:* ${order.NamaProduk} (${order.Qty} item)\n` +
      (order.Kategori === 'meteran' ? `📐 *Ukuran:* ${order.Panjang} x ${order.Lebar} cm (${order.Finishing})\n` : '') +
      `💰 *Total:* ${formatRp(order.TotalHarga)}\n` +
      `🏷️ *Status Pembayaran:* ${order.StatusBayar}\n` +
      `🚀 *Status Order:* ${order.StatusOrder}\n\n` +
      `Mohon informasinya mengenai status pengerjaan atau detail cetak. Terima kasih!`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const isMeteran = order.Kategori === 'meteran';
  const luasM2 = isMeteran ? Math.max(1, ((order.Panjang || 100) / 100) * ((order.Lebar || 100) / 100)) : 0;
  const subtotalProduk = order.TotalHarga - (order.JasaDesain || 0) - (order.JasaCutting || 0) - (order.JasaLaminating || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-teal-100">
                Detail Transaksi
              </span>
              <span className="text-[10px] font-mono text-teal-200">
                {order.ID}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              {order.NamaProduk}
            </h3>
            <p className="text-[11px] text-teal-200 mt-0.5">
              {formatDate(order.Tgl)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          {/* Branded Store Info Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              {storeData.logo_url ? (
                <img
                  src={storeData.logo_url}
                  alt={storeData.nama_toko || 'Alinea Desain'}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  {(storeData.nama_toko?.slice(0, 2) || 'AD').toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">
                  {storeData.nama_toko || 'Alinea Desain'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {storeData.tagline || 'Percetakan & Digital Printing'}
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <div>WA: {storeData.kontak}</div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold mb-1">
                Status Pesanan
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
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Customer:</span>
              <span className="font-bold text-slate-800">{order.NamaCustomer}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>ID Khusus Customer:</span>
              <span className="font-mono font-bold text-teal-700">{order.KodeCustomer}</span>
            </div>
            {order.NoCustomer && (
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>WhatsApp:</span>
                <span className="font-semibold text-slate-700">{order.NoCustomer}</span>
              </div>
            )}
          </div>

          {/* Spesifikasi Item */}
          {order.Items && order.Items.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Daftar Produk Pesanan ({order.Items.length} Item)
              </h4>
              <div className="space-y-2">
                {order.Items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>
                        {idx + 1}. {item.namaProduk}
                      </span>
                      <span className="text-teal-700 font-extrabold">
                        {formatRp(item.subtotal)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                      <span>Qty: {item.qty} pcs</span>
                      {item.kategori === 'meteran' && item.panjang && item.lebar && (
                        <span>
                          • Ukuran: {item.panjang}x{item.lebar} cm ({item.finishing || 'Simkel'})
                        </span>
                      )}
                      {item.withDesain && <span>• Desain (+{formatRp(item.jasaDesain || 0)})</span>}
                      {item.withCutting && <span>• Cutting (+{formatRp(item.jasaCutting || 0)})</span>}
                      {item.withLaminating && <span>• Laminating (+{formatRp(item.jasaLaminating || 0)})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Spesifikasi Produk
              </h4>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-teal-600" /> Kategori Cetak
                  </span>
                  <span className="font-semibold capitalize text-slate-800">
                    {order.Kategori}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" /> Jumlah Order (Qty)
                  </span>
                  <span className="font-bold text-slate-800">{order.Qty} pcs</span>
                </div>

                {isMeteran && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-teal-600" /> Dimensi (P x L)
                      </span>
                      <span className="font-semibold text-slate-800">
                        {order.Panjang} cm x {order.Lebar} cm
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Luas</span>
                      <span className="font-semibold text-slate-700">
                        {luasM2.toFixed(2)} m² / item
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Finishing MMT</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {order.Finishing || 'Tanpa Finishing'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Rincian Biaya */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Rincian Tagihan & Pembayaran
            </h4>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 space-y-2 shadow-2xs">
              {(!order.Items || order.Items.length === 0) && (
                <>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Biaya Cetak Produk</span>
                    <span className="font-semibold">{formatRp(subtotalProduk)}</span>
                  </div>

                  {order.JasaDesain > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3 text-teal-600" /> Jasa Desain
                      </span>
                      <span className="font-semibold text-teal-700">
                        +{formatRp(order.JasaDesain)}
                      </span>
                    </div>
                  )}

                  {order.JasaCutting > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-teal-600" /> Jasa Cutting Presisi
                      </span>
                      <span className="font-semibold text-teal-700">
                        +{formatRp(order.JasaCutting)}
                      </span>
                    </div>
                  )}

                  {order.JasaLaminating > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-teal-600" /> Jasa Laminating
                      </span>
                      <span className="font-semibold text-teal-700">
                        +{formatRp(order.JasaLaminating)}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Tagihan:</span>
                <span className="text-teal-700 text-base font-extrabold">
                  {formatRp(order.TotalHarga)}
                </span>
              </div>

              {/* DP & Sisa Tagihan */}
              {(order.NominalDP || order.StatusBayar === 'DP') && (
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-teal-800">
                    <span className="font-medium">Uang Muka (DP) Terbayar:</span>
                    <span className="font-bold">{formatRp(order.NominalDP || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-700 pt-1 border-t border-teal-200/60 font-bold">
                    <span>Sisa Tagihan Belum Lunas:</span>
                    <span className="text-sm font-extrabold">
                      {formatRp(Math.max(0, order.TotalHarga - (order.NominalDP || 0)))}
                    </span>
                  </div>
                </div>
              )}
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

          {/* Informasi Pembayaran Toko */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
                <span>Info Pembayaran & Transfer</span>
              </div>
              <button
                onClick={handleCopyRekening}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition"
              >
                {copiedRekening ? (
                  <>
                    <Check className="w-3 h-3 text-teal-400" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Salin Rekening
                  </>
                )}
              </button>
            </div>
            <div className="text-[11px] text-slate-300 font-mono bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              {storeData.rekening || 'BCA 1234567890 a.n Alinea Desain'}
            </div>
            <p className="text-[10px] text-slate-400">
              Setelah transfer, kirim bukti bayar melalui tombol WhatsApp di bawah.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat CS & Konfirmasi</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 px-3.5 rounded-xl text-xs flex items-center justify-center transition active:scale-95"
            title="Cetak Ringkasan"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
