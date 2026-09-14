import React, { useState, useEffect } from 'react';
import {
  Store,
  Image,
  Sparkles,
  Check,
  RotateCcw,
  Eye,
  Type,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { StoreData } from '../types';

interface AdminStoreBrandingManagerProps {
  storeData: StoreData;
  onSaveBranding: (updated: { nama_toko: string; tagline: string; logo_url: string }) => void;
}

const PRESET_LOGOS = [
  {
    name: 'Modern Cyan Print',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    desc: 'Desain modern abstrak percetakan digital'
  },
  {
    name: 'Offset Printing Press',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80',
    desc: 'Mesin cetak profesional industri'
  },
  {
    name: 'Creative Studio Indigo',
    url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80',
    desc: 'Branding studio desain & periklanan'
  },
  {
    name: 'Typography Monogram',
    url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200&auto=format&fit=crop&q=80',
    desc: 'Simbol tipografi percetakan elegan'
  }
];

export const AdminStoreBrandingManager: React.FC<AdminStoreBrandingManagerProps> = ({
  storeData,
  onSaveBranding
}) => {
  const [namaToko, setNamaToko] = useState(storeData.nama_toko || 'Alinea Desain');
  const [tagline, setTagline] = useState(
    storeData.tagline || 'Percetakan & Digital Printing Cepat Berkualitas'
  );
  const [logoUrl, setLogoUrl] = useState(storeData.logo_url || '');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setNamaToko(storeData.nama_toko || 'Alinea Desain');
    setTagline(storeData.tagline || 'Percetakan & Digital Printing Cepat Berkualitas');
    setLogoUrl(storeData.logo_url || '');
    setImgError(false);
  }, [storeData]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding({
      nama_toko: namaToko.trim() || 'Alinea Desain',
      tagline: tagline.trim(),
      logo_url: logoUrl.trim()
    });
  };

  const handleResetToDefault = () => {
    setNamaToko('Alinea Desain');
    setTagline('Percetakan & Digital Printing Cepat Berkualitas');
    setLogoUrl('');
    setImgError(false);
  };

  // Get initials for fallback
  const getInitials = (text: string) => {
    const parts = text.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (text.slice(0, 2) || 'AD').toUpperCase();
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Pengaturan Identitas & Logo Toko
            </h3>
            <p className="text-[10px] text-slate-400">
              Sesuaikan nama percetakan dan logo yang tampil di navigasi, nota, dan faktur
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetToDefault}
          className="text-[10px] text-slate-500 hover:text-teal-700 flex items-center gap-1 font-bold"
          title="Kembali ke setelan default"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="p-3.5 bg-slate-900 rounded-2xl text-white space-y-2 border border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
          <span className="font-bold flex items-center gap-1 text-teal-400">
            <Eye className="w-3 h-3" /> Preview Header Navigasi Aplikasi:
          </span>
          <span className="font-mono text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">
            Live Preview
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            {logoUrl && !imgError ? (
              <img
                src={logoUrl}
                alt="Logo Toko"
                onError={() => setImgError(true)}
                className="w-9 h-9 rounded-xl object-cover border border-teal-500/40 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center font-extrabold text-sm text-white shadow-xs border border-teal-400/30">
                {getInitials(namaToko)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs tracking-tight text-white line-clamp-1">
                  {namaToko || 'Alinea Desain'}
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-teal-800/80 text-teal-200 border border-teal-600/60">
                  Panel Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">
                {tagline || 'Percetakan & Digital Printing'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Input */}
      <form onSubmit={handleSave} className="space-y-3.5">
        <div>
          <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-teal-600" />
            <span>Nama Toko / Percetakan *</span>
          </label>
          <input
            type="text"
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            placeholder="Contoh: Alinea Desain Printing & Advertising"
            required
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            * Nama ini menggantikan teks brand di seluruh sistem, cetak nota, dan laporan.
          </p>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Tagline / Slogan Toko</span>
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Contoh: Solusi Cetak Cepat, Murah & Berkualitas di Jogja"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-teal-600" />
              <span>URL Logo Toko</span>
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="text-[10px] text-rose-600 hover:underline"
              >
                Hapus Logo
              </button>
            )}
          </div>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => {
              setLogoUrl(e.target.value);
              setImgError(false);
            }}
            placeholder="https://... (URL gambar logo PNG / JPG / WebP)"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Kosongkan jika ingin menggunakan badge inisial logo default otomatis.
          </p>
        </div>

        {/* Pilihan Preset Logo */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Atau Pilih dari Preset Logo Rekomendasi:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_LOGOS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setLogoUrl(preset.url);
                  setImgError(false);
                }}
                className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                  logoUrl === preset.url
                    ? 'border-teal-500 bg-teal-50/80'
                    : 'border-slate-200 hover:border-teal-300 bg-slate-50/60'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                />
                <div className="overflow-hidden">
                  <div className="font-bold text-[10px] text-slate-800 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {preset.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Simpan Identitas & Logo Toko</span>
        </button>
      </form>
    </div>
  );
};
