import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Building2,
  Image,
  Eye,
  Check,
  X,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { ClientPartner } from '../types';

interface AdminTokoSliderManagerProps {
  clients: ClientPartner[];
  onUpdateClients: (updated: ClientPartner[]) => void;
}

const PRESET_LOGOS = [
  {
    nama: 'Universitas Gadjah Mada',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=160&auto=format&fit=crop&q=80',
    kategori: 'Pendidikan'
  },
  {
    nama: 'Universitas Diponegoro',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=160&auto=format&fit=crop&q=80',
    kategori: 'Pendidikan'
  },
  {
    nama: 'Rubytech Digital',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    kategori: 'Perusahaan'
  },
  {
    nama: 'J&T Express Logistics',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=160&auto=format&fit=crop&q=80',
    kategori: 'Logistik'
  },
  {
    nama: 'Klinik Medika Sehat',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=160&auto=format&fit=crop&q=80',
    kategori: 'Kesehatan'
  },
  {
    nama: 'Kopi Kenangan Senja',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&auto=format&fit=crop&q=80',
    kategori: 'F&B UMKM'
  }
];

export const AdminTokoSliderManager: React.FC<AdminTokoSliderManagerProps> = ({
  clients,
  onUpdateClients
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formKategori, setFormKategori] = useState('Pendidikan');

  const resetForm = () => {
    setFormNama('');
    setFormLogo('');
    setFormKeterangan('');
    setFormKategori('Pendidikan');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleStartEdit = (item: ClientPartner) => {
    setEditingId(item.id);
    setFormNama(item.nama);
    setFormLogo(item.logo);
    setFormKeterangan(item.keterangan);
    setFormKategori(item.kategori || 'Pendidikan');
    setShowAddForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    if (editingId) {
      // Edit existing
      const updated = clients.map((c) =>
        c.id === editingId
          ? {
              ...c,
              nama: formNama.trim(),
              logo: formLogo.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
              keterangan: formKeterangan.trim(),
              kategori: formKategori
            }
          : c
      );
      onUpdateClients(updated);
    } else {
      // Add new
      const newItem: ClientPartner = {
        id: 'c_' + Date.now(),
        nama: formNama.trim(),
        logo: formLogo.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
        keterangan: formKeterangan.trim(),
        kategori: formKategori
      };
      onUpdateClients([newItem, ...clients]);
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus instansi/customer ini dari slider home?')) {
      onUpdateClients(clients.filter((c) => c.id !== id));
    }
  };

  const selectPreset = (preset: typeof PRESET_LOGOS[0]) => {
    setFormNama(preset.nama);
    setFormLogo(preset.url);
    setFormKategori(preset.kategori);
    if (!formKeterangan) {
      setFormKeterangan(`Cetak Banner & Merchandise Resmi ${preset.nama}`);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-4">
      {/* Title & Action */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Slider Instansi / Customer Pernah Order</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Atur logo gambar, nama instansi, dan keterangan pesanan yang tampil otomatis di beranda
          </p>
        </div>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        )}
      </div>

      {/* Form Add / Edit */}
      {showAddForm && (
        <form
          onSubmit={handleSave}
          className="bg-slate-50 p-4 rounded-2xl border border-teal-100 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="font-bold text-xs text-teal-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              {editingId ? 'Edit Instansi / Customer' : 'Tambah Instansi Baru'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
              Pilih Cepat Contoh Instansi / Logo:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOGOS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className="text-[10px] bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg transition flex items-center gap-1"
                >
                  <img
                    src={p.url}
                    alt={p.nama}
                    className="w-3.5 h-3.5 rounded-xs object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span>{p.nama}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Nama Instansi / Customer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: Universitas Gadjah Mada"
                className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Kategori Instansi
              </label>
              <select
                value={formKategori}
                onChange={(e) => setFormKategori(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Pendidikan">Pendidikan (Kampus / Sekolah)</option>
                <option value="Perusahaan">Perusahaan / Korporasi</option>
                <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                <option value="UMKM">UMKM & Bisnis Lokal</option>
                <option value="Sosial & Komunitas">Sosial & Komunitas</option>
                <option value="Logistik">Logistik & Ekspedisi</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-600 block mb-1">
                URL Logo / Foto Instansi
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="https://... (URL gambar logo PNG / JPG)"
                  className="flex-1 p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-xs"
                />
                {formLogo && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center p-0.5">
                    <img
                      src={formLogo}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-600 block mb-1">
                Keterangan Pekerjaan / Pesanan yang Pernah Dibuat
              </label>
              <input
                type="text"
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="Contoh: Cetak Buku Panduan, Banner Seminar & Sertifikat KKN"
                className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan ke Slider'}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* List of current slider items */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase font-bold tracking-wider px-1">
          <span>Daftar Logo Aktif ({clients.length})</span>
          <span>Aksi</span>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-xl text-xs text-slate-400 bg-slate-50">
            Belum ada instansi yang ditambahkan ke slider.
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-200/80 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 p-0.5">
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.nama}
                        className="w-full h-full object-cover rounded-md"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-teal-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800 truncate">
                        {item.nama}
                      </span>
                      {item.kategori && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-semibold flex-shrink-0">
                          {item.kategori}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.keterangan || 'Pesanan cetak rutin'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pl-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-700 transition"
                    title="Edit Instansi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 transition"
                    title="Hapus dari Slider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
