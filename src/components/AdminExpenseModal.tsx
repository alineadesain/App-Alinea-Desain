import React, { useState } from 'react';
import { Expense } from '../types';
import { X, Receipt, DollarSign, Calendar, Store, FileText, Image, Check } from 'lucide-react';

interface AdminExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Expense) => void;
}

export const AdminExpenseModal: React.FC<AdminExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense
}) => {
  if (!isOpen) return null;

  const [tgl, setTgl] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [total, setTotal] = useState<number | ''>('');
  const [toko, setToko] = useState('');
  const [detail, setDetail] = useState('');
  const [notaUrl, setNotaUrl] = useState('');

  const formatRp = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!total || Number(total) <= 0) {
      alert('Mohon masukkan nominal pengeluaran yang valid!');
      return;
    }
    if (!toko.trim()) {
      alert('Mohon isi nama toko atau keperluan pengeluaran!');
      return;
    }
    if (!detail.trim()) {
      alert('Mohon isi detail atau keterangan pengeluaran!');
      return;
    }

    const newExpense: Expense = {
      ID: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
      Tgl: tgl,
      Total: Number(total),
      Toko: toko.trim(),
      Detail: detail.trim(),
      NotaUrl: notaUrl.trim() || undefined
    };

    onSaveExpense(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-700 to-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Catat Pengeluaran Baru</h3>
              <p className="text-[10px] text-rose-200">
                Pencatatan biaya operasional, bahan baku & toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Tanggal Pengeluaran */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Tanggal Transaksi</span>
            </label>
            <input
              type="date"
              value={tgl}
              onChange={(e) => setTgl(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Nominal Pengeluaran */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-rose-600" />
              <span>Nominal Pengeluaran (Rp)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={total}
              onChange={(e) => setTotal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 150000"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
            {Number(total) > 0 && (
              <p className="text-[11px] font-extrabold text-rose-700 mt-1">
                Terbaca: {formatRp(Number(total))}
              </p>
            )}
          </div>

          {/* Toko / Vendor / Keperluan */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Store className="w-3.5 h-3.5 text-rose-600" />
              <span>Toko / Vendor / Keperluan</span>
            </label>
            <input
              type="text"
              value={toko}
              onChange={(e) => setToko(e.target.value)}
              placeholder="Contoh: CV Anugerah Media Bahan / Toko Tinta Mandiri / Listrik"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Detail / Keterangan */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Detail / Keterangan Pengeluaran</span>
            </label>
            <textarea
              rows={2}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Contoh: Beli 1 roll bahan flexi 280g dan mata ayam 1 kotak"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* URL Nota / Foto Bukti (Opsional) */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Image className="w-3.5 h-3.5 text-rose-600" />
              <span>Link Nota / Bukti Bayar (Opsional)</span>
            </label>
            <input
              type="url"
              value={notaUrl}
              onChange={(e) => setNotaUrl(e.target.value)}
              placeholder="https://drive.google.com/... atau link foto nota"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengeluaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
