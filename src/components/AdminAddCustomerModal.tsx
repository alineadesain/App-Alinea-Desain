import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, Mail, Key, ShieldCheck, Check } from 'lucide-react';
import { User } from '../types';
import { cleanWhatsAppPhone } from '../utils/whatsappFormatter';

interface AdminAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: User) => void;
  existingUsers: User[];
}

export const AdminAddCustomerModal: React.FC<AdminAddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  existingUsers
}) => {
  const [nama, setNama] = useState('');
  const [noWA, setNoWA] = useState('');
  const [alamat, setAlamat] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('cust123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNama = nama.trim();
    const trimmedWA = noWA.trim();
    const trimmedAlamat = alamat.trim();

    if (!trimmedNama) {
      setErrorMsg('Nama lengkap customer wajib diisi');
      return;
    }

    if (!trimmedWA) {
      setErrorMsg('Nomor WhatsApp customer wajib diisi');
      return;
    }

    const cleanWA = cleanWhatsAppPhone(trimmedWA);
    if (!cleanWA || cleanWA.length < 8) {
      setErrorMsg('Nomor WhatsApp tidak valid. Masukkan nomor yang benar.');
      return;
    }

    // Periksa apakah nomor WA sudah digunakan
    const alreadyRegistered = existingUsers.some(
      (u) => u.NoWA && cleanWhatsAppPhone(u.NoWA) === cleanWA
    );
    if (alreadyRegistered) {
      setErrorMsg('Nomor WhatsApp ini sudah terdaftar sebagai customer.');
      return;
    }

    // Generate kode unik customer
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const kodeKhusus = `CUST-${randomCode}`;
    const cleanName = trimmedNama.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cust';
    const finalEmail = email.trim() || `${cleanName}@gmail.com`;
    const finalPassword = password.trim() || 'cust123';

    const newCustomer: User = {
      ID: 'U' + Date.now(),
      Role: 'customer',
      KodeKhusus: kodeKhusus,
      Nama: trimmedNama,
      NoWA: trimmedWA,
      Alamat: trimmedAlamat || 'Yogyakarta',
      Password: finalPassword,
      Email: finalEmail,
      TglDaftar: new Date().toISOString()
    };

    onSaveCustomer(newCustomer);

    // Reset Form
    setNama('');
    setNoWA('');
    setAlamat('');
    setEmail('');
    setPassword('cust123');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-linear-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-teal-100 block w-max mb-1">
                Database Customer
              </span>
              <h3 className="text-base font-bold text-white">Tambah Customer Baru</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Nama Customer */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nama Lengkap Customer <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Budi Santoso / CV Maju Jaya"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nomor WhatsApp <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={noWA}
                onChange={(e) => setNoWA(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Nomor ini digunakan untuk kirim nota WhatsApp & konfirmasi order otomatis.
            </p>
          </div>

          {/* Alamat */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Alamat Lengkap / Instansi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                required
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Alamat kantor, outlet, atau domisili pengiriman"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none h-18"
              />
            </div>
          </div>

          {/* Email (Opsional) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Email Customer <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Akun */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Password Akun Pelanggan <span className="text-slate-400 font-normal">(Default: cust123)</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="cust123"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Dapat dipakai customer jika ingin login ke web toko untuk memantau status pesanannya.
            </p>
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Customer akan otomatis mendapat <strong>Kode Khusus Pelanggan</strong> dan langsung tersimpan ke Google Sheets sheet <code>Users</code>.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
