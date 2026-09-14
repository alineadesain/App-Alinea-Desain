import React, { useState } from 'react';
import { Product } from '../types';
import { X, Boxes, Image, Sparkles, Check } from 'lucide-react';

interface AdminAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product | null;
}

const PRESET_IMAGES = [
  { label: 'Banner MMT', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80' },
  { label: 'Stiker Vinyl', url: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&auto=format&fit=crop&q=80' },
  { label: 'Kartu Nama', url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80' },
  { label: 'Brosur & Flyer', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=80' },
  { label: 'X-Banner', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80' },
  { label: 'Merchandise', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80' }
];

export const AdminAddProductModal: React.FC<AdminAddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct
}) => {
  if (!isOpen) return null;

  const [nama, setNama] = useState(initialProduct?.Nama || '');
  const [kategori, setKategori] = useState<'meteran' | 'satuan'>(initialProduct?.Kategori || 'meteran');
  const [harga, setHarga] = useState(initialProduct?.Harga ? String(initialProduct.Harga) : '25000');
  const [deskripsi, setDeskripsi] = useState(initialProduct?.Deskripsi || '');
  const [thumbnail, setThumbnail] = useState(
    initialProduct?.Thumbnail || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80'
  );
  const [hargaDesain, setHargaDesain] = useState(initialProduct?.HargaDesain ? String(initialProduct.HargaDesain) : '15000');
  const [hargaCutting, setHargaCutting] = useState(initialProduct?.HargaCutting ? String(initialProduct.HargaCutting) : '0');
  const [hargaLaminating, setHargaLaminating] = useState(initialProduct?.HargaLaminating ? String(initialProduct.HargaLaminating) : '0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }
    const hargaNum = parseInt(harga, 10) || 0;
    if (hargaNum <= 0) {
      alert('Harga produk harus lebih dari 0!');
      return;
    }

    const productData: Product = {
      ID: initialProduct?.ID || 'P' + Date.now(),
      Nama: nama.trim(),
      Kategori: kategori,
      Harga: hargaNum,
      Deskripsi: deskripsi.trim() || `${kategori === 'meteran' ? 'Cetak bahan outdoor/indoor meteran berkualitas' : 'Cetak satuan presisi siap kirim'}`,
      Thumbnail: thumbnail.trim() || 'https://placehold.co/400x300?text=Produk',
      Terjual: initialProduct?.Terjual || 0,
      HargaDesain: parseInt(hargaDesain, 10) || 0,
      HargaCutting: parseInt(hargaCutting, 10) || 0,
      HargaLaminating: parseInt(hargaLaminating, 10) || 0
    };

    onSave(productData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {initialProduct ? 'Edit Produk Percetakan' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-[10px] text-teal-200">
                Data akan tersimpan ke katalog produk & spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* Nama Produk */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Banner MMT 340gram High-Res"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Kategori & Harga */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tipe Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => {
                  const val = e.target.value as 'meteran' | 'satuan';
                  setKategori(val);
                  if (val === 'satuan' && hargaCutting === '0') setHargaCutting('3000');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="meteran">Meteran (MMT/Spanduk per m²)</option>
                <option value="satuan">Satuan (Stiker/Box/Pcs)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Harga Dasar (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">Rp</span>
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={harga}
                  onChange={(e) => setHarga(e.target.value)}
                  placeholder="25000"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {kategori === 'meteran' ? 'Dihitung per meter persegi (m²)' : 'Dihitung per pcs / lembar / box'}
              </span>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Deskripsi Produk
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan bahan, kegunaan, atau keunggulan cetakan..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* URL Gambar & Presets */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>URL Foto / Thumbnail Produk</span>
              <span className="text-[10px] text-teal-700 font-normal">Pilih Preset di Bawah:</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <img
                src={thumbnail}
                alt="Preview"
                className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Foto';
                }}
              />
            </div>

            {/* Presets chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_IMAGES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setThumbnail(p.url)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                    thumbnail === p.url
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pengaturan Jasa Bawaan */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-[11px] text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Tarif Jasa Tambahan Produk Ini</span>
              <span className="text-[9px] text-slate-400 font-normal">Opsional saat customer order</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                  Jasa Desain (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={hargaDesain}
                  onChange={(e) => setHargaDesain(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                  Jasa Cutting (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={hargaCutting}
                  onChange={(e) => setHargaCutting(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                  Laminating (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={hargaLaminating}
                  onChange={(e) => setHargaLaminating(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{initialProduct ? 'Simpan Perubahan Produk' : 'Simpan & Terbitkan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
