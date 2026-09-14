import React, { useState } from 'react';
import { BannerSlide } from '../types';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Layers,
  Palette
} from 'lucide-react';

interface AdminBannerManagerProps {
  banners: BannerSlide[];
  onUpdateBanners: (updated: BannerSlide[]) => void;
}

const GRADIENT_PRESETS = [
  { label: 'Teal ke Dark', value: 'from-teal-700 via-teal-800 to-slate-900' },
  { label: 'Emerald Hijau', value: 'from-emerald-800 via-teal-900 to-slate-900' },
  { label: 'Biru Samudra', value: 'from-blue-700 via-indigo-900 to-slate-900' },
  { label: 'Ungu Elegan', value: 'from-purple-800 via-indigo-950 to-slate-900' },
  { label: 'Amber Oranye', value: 'from-amber-700 via-orange-900 to-slate-900' },
  { label: 'Merah Berani', value: 'from-rose-700 via-red-900 to-slate-900' }
];

export const AdminBannerManager: React.FC<AdminBannerManagerProps> = ({
  banners,
  onUpdateBanners
}) => {
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [tag, setTag] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bgGradient, setBgGradient] = useState(GRADIENT_PRESETS[0].value);
  const [actionText, setActionText] = useState('Pesan Sekarang');
  const [actionTarget, setActionTarget] = useState<'order' | 'products' | 'contact'>('order');
  const [imageUrl, setImageUrl] = useState('');

  const handleStartAdd = () => {
    setEditingBanner(null);
    setTag('PROMO TERBARU');
    setTitle('Spanduk Kilat 2 Jam Jadi');
    setDescription('Cetak spanduk outdoor dengan kualitas warna cerah dan bahan awet.');
    setBgGradient(GRADIENT_PRESETS[0].value);
    setActionText('Pesan Sekarang');
    setActionTarget('order');
    setImageUrl('https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80');
    setIsAddingNew(true);
  };

  const handleStartEdit = (b: BannerSlide) => {
    setEditingBanner(b);
    setTag(b.tag || '');
    setTitle(b.title || '');
    setDescription(b.description || '');
    setBgGradient(b.bgGradient || GRADIENT_PRESETS[0].value);
    setActionText(b.actionText || 'Pesan Sekarang');
    setActionTarget(b.actionTarget || 'order');
    setImageUrl(b.imageUrl || '');
    setIsAddingNew(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul banner wajib diisi!');
      return;
    }

    if (editingBanner) {
      const updated = banners.map((b) =>
        b.id === editingBanner.id
          ? {
              ...b,
              tag: tag.trim(),
              title: title.trim(),
              description: description.trim(),
              bgGradient,
              actionText: actionText.trim(),
              actionTarget,
              imageUrl: imageUrl.trim() || undefined
            }
          : b
      );
      onUpdateBanners(updated);
      setEditingBanner(null);
    } else {
      const newBanner: BannerSlide = {
        id: 'banner_' + Date.now(),
        tag: tag.trim() || 'PROMO',
        title: title.trim(),
        description: description.trim(),
        bgGradient,
        actionText: actionText.trim() || 'Lihat',
        actionTarget,
        imageUrl: imageUrl.trim() || undefined
      };
      onUpdateBanners([...banners, newBanner]);
      setIsAddingNew(false);
    }
  };

  const handleDelete = (id: string) => {
    if (banners.length <= 1) {
      alert('Minimal harus ada 1 banner promo di beranda!');
      return;
    }
    if (window.confirm('Yakin ingin menghapus banner ini?')) {
      onUpdateBanners(banners.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Banner Promo Beranda ({banners.length})
            </h3>
            <p className="text-[10px] text-slate-400">
              Banner slider promosi yang tampil di bagian atas menu Home customer
            </p>
          </div>
        </div>

        {!isAddingNew && !editingBanner && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Banner</span>
          </button>
        )}
      </div>

      {/* Form Add / Edit */}
      {(isAddingNew || editingBanner) && (
        <form
          onSubmit={handleSave}
          className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-teal-100 pb-2">
            <span className="font-bold text-teal-900">
              {editingBanner ? 'Edit Banner Promo' : 'Tambah Banner Promo Baru'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingBanner(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tag / Label Atas</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Contoh: PROMO SPESIAL"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Tombol Aksi</label>
              <select
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="order">Buka Menu Order Form</option>
                <option value="products">Buka Katalog Produk</option>
                <option value="contact">Hubungi WhatsApp CS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Judul Banner</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Cetak MMT 280g Kilat Cuma 21rb"
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan promo menarik untuk customer..."
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Teks Tombol Aksi</label>
              <input
                type="text"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="Pesan Sekarang"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">URL Gambar Latar (Opsional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Gradient Presets */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              <span>Pilihan Warna Gradien Latar</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {GRADIENT_PRESETS.map((gp) => (
                <button
                  type="button"
                  key={gp.value}
                  onClick={() => setBgGradient(gp.value)}
                  className={`p-2 rounded-xl border text-[11px] font-bold text-left transition flex items-center justify-between ${
                    bgGradient === gp.value
                      ? 'border-teal-600 bg-teal-100 text-teal-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{gp.label}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${gp.value} flex-shrink-0 ml-1`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Live Mini Preview */}
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Pratinjau Tampilan Banner:
            </span>
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${bgGradient} text-white space-y-2 relative overflow-hidden shadow-sm`}
            >
              {imageUrl && (
                <div className="absolute inset-0 opacity-15 mix-blend-overlay">
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="relative z-10 space-y-1">
                <span className="inline-block bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {tag || 'PROMO'}
                </span>
                <h4 className="font-extrabold text-sm">{title || 'Judul Banner Anda'}</h4>
                <p className="text-[11px] text-white/80 line-clamp-2">
                  {description || 'Deskripsi banner akan tampil di sini'}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 bg-white text-teal-900 px-3 py-1 rounded-xl font-bold text-[11px]">
                    {actionText || 'Pesan Sekarang'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingBanner(null);
              }}
              className="flex-1 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Banner</span>
            </button>
          </div>
        </form>
      )}

      {/* Banner Cards List */}
      <div className="space-y-2.5">
        {banners.map((b, idx) => (
          <div
            key={b.id}
            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 justify-between hover:border-teal-300 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.bgGradient} flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-inner`}
              >
                #{idx + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-teal-700 border border-slate-200">
                    {b.tag}
                  </span>
                  <span className="text-[10px] text-slate-400">Target: {b.actionTarget}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 truncate mt-0.5">{b.title}</h4>
                <p className="text-[10px] text-slate-500 truncate">{b.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleStartEdit(b)}
                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-white rounded-lg transition"
                title="Edit Banner"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(b.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                title="Hapus Banner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
