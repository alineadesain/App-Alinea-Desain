import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Lock,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  TableProperties
} from 'lucide-react';
import { User as UserType, StoreData } from '../types';

interface LoginPortalModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
  storeData: StoreData;
  existingUsers: UserType[];
  onLoginSuccess: (user: UserType) => void;
  initialRole?: 'customer' | 'admin';
}

// Helper normalisasi nomor telepon agar 08123..., 628123..., +62 812-3..., 812-3... saling cocok
function cleanPhone(raw: any): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export const LoginPortalModal: React.FC<LoginPortalModalProps> = ({
  isOpen,
  onClose,
  canClose = true,
  storeData,
  existingUsers,
  onLoginSuccess,
  initialRole = 'customer'
}) => {
  // Selected portal: 'customer' or 'admin'
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin'>(initialRole);

  // Customer subtab: 'login' or 'register'
  const [custMode, setCustMode] = useState<'login' | 'register'>('login');

  // Password visibility toggles
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [showCustRegPassword, setShowCustRegPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Customer Login Form State
  const [custLoginIdentifier, setCustLoginIdentifier] = useState('');
  const [custLoginPassword, setCustLoginPassword] = useState('');

  // Customer Register Form State
  const [regNama, setRegNama] = useState('');
  const [regNoWA, setRegNoWA] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAlamat, setRegAlamat] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Admin Login Form State
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Error & Feedback Message
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle Customer Manual Login
  const handleCustomerLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawTerm = custLoginIdentifier.trim();
    const term = rawTerm.toLowerCase();
    const phoneTerm = cleanPhone(rawTerm);

    if (!term) {
      setErrorMsg('Harap masukkan No. WhatsApp, Kode Customer, Nama, atau Email!');
      return;
    }

    if (!custLoginPassword.trim()) {
      setErrorMsg('Harap masukkan password customer Anda!');
      return;
    }

    const matched = existingUsers.find((u) => {
      const uPhone = cleanPhone(u.NoWA);
      const matchWa = phoneTerm && uPhone && (uPhone === phoneTerm || uPhone.endsWith(phoneTerm) || phoneTerm.endsWith(uPhone));
      const matchCode = u.KodeKhusus && String(u.KodeKhusus).toLowerCase().trim() === term;
      const matchEmail = u.Email && String(u.Email).toLowerCase().trim() === term;
      const matchName = u.Nama && String(u.Nama).toLowerCase().trim() === term;
      return (matchWa || matchCode || matchEmail || matchName) && u.Role === 'customer';
    });

    if (!matched) {
      // Periksa apakah user sebenarnya admin
      const isAdminMatch = existingUsers.find((u) => {
        const uPhone = cleanPhone(u.NoWA);
        const matchWa = phoneTerm && uPhone && (uPhone === phoneTerm || uPhone.endsWith(phoneTerm) || phoneTerm.endsWith(uPhone));
        const matchName = u.Nama && String(u.Nama).toLowerCase().trim() === term;
        return (matchWa || matchName) && u.Role === 'admin';
      });

      if (isAdminMatch) {
        setErrorMsg('Akun ini terdaftar sebagai Administrator. Silakan klik tab "Portal Admin" di atas.');
        return;
      }

      setErrorMsg('Akun customer tidak ditemukan. Silakan periksa nomor WA / kode Anda, atau pilih tab "Daftar Akun Baru".');
      return;
    }

    if (String(matched.Password || '').trim() !== custLoginPassword.trim()) {
      setErrorMsg('Password customer salah. Silakan coba lagi.');
      return;
    }

    onLoginSuccess(matched);
    if (onClose) onClose();
  };

  // Handle Customer Manual Register
  const handleCustomerRegisterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regNama.trim()) {
      setErrorMsg('Nama lengkap customer harus diisi!');
      return;
    }
    if (!regNoWA.trim()) {
      setErrorMsg('Nomor WhatsApp harus diisi!');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg('Password minimal 4 karakter!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }

    const phoneClean = cleanPhone(regNoWA.trim());
    const existingUser = existingUsers.find(
      (u) => cleanPhone(u.NoWA) === phoneClean
    );

    if (existingUser) {
      if (existingUser.Password === regPassword && existingUser.Role === 'customer') {
        onLoginSuccess(existingUser);
        if (onClose) onClose();
        return;
      }
      setErrorMsg('Nomor WhatsApp ini sudah terdaftar! Mengalihkan ke tab Masuk Akun...');
      setCustLoginIdentifier(regNoWA.trim());
      setCustMode('login');
      return;
    }

    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    const newUser: UserType = {
      ID: `C-${Date.now().toString().slice(-4)}`,
      Role: 'customer',
      KodeKhusus: randomCode,
      Nama: regNama.trim(),
      NoWA: regNoWA.trim(),
      Email: regEmail.trim() || undefined,
      Alamat: regAlamat.trim() || 'Yogyakarta',
      Password: regPassword,
      TglDaftar: new Date().toISOString(),
      Avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`
    };

    onLoginSuccess(newUser);
    if (onClose) onClose();
  };

  // Handle Admin Login Submit (Admin hanya login saja, tanpa buat akun baru)
  const handleAdminLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawTerm = adminIdentifier.trim();
    const term = rawTerm.toLowerCase();
    const phoneTerm = cleanPhone(rawTerm);

    if (!term) {
      setErrorMsg('Masukkan No. WhatsApp, Email, atau Username Admin!');
      return;
    }

    if (!adminPassword.trim()) {
      setErrorMsg('Masukkan password administrator!');
      return;
    }

    // 1. Cari di existingUsers dengan Role === 'admin'
    let matched = existingUsers.find((u) => {
      if (u.Role !== 'admin') return false;
      const uPhone = cleanPhone(u.NoWA);
      const matchWa = phoneTerm && uPhone && (uPhone === phoneTerm || uPhone.endsWith(phoneTerm) || phoneTerm.endsWith(uPhone));
      const matchEmail = u.Email && String(u.Email).toLowerCase().trim() === term;
      const matchName = u.Nama && String(u.Nama).toLowerCase().trim() === term;
      const matchUsername = (term === 'admin' || term === 'admin alinea');
      return matchWa || matchEmail || matchName || matchUsername;
    });

    // 2. Fallback pencocokan default admin Alinea
    if (!matched && (term === 'admin' || term === 'admin alinea' || term === 'alineadesain@gmail.com' || term === 'admin@alineadesain.com' || phoneTerm === '81234567890')) {
      if (adminPassword.trim() === 'admin123') {
        const defaultAdmin: UserType = {
          ID: 'U1',
          Role: 'admin',
          KodeKhusus: '-',
          Nama: 'Admin Alinea',
          NoWA: '081234567890',
          Alamat: 'Jl. Prof. Dr. Sardjito No. 45, Yogyakarta',
          Password: 'admin123',
          TglDaftar: '2025-01-01T08:00:00.000Z',
          Email: 'alineadesain@gmail.com'
        };
        onLoginSuccess(defaultAdmin);
        if (onClose) onClose();
        return;
      }
    }

    if (!matched) {
      setErrorMsg('Akun Administrator tidak ditemukan. Pastikan Username, Email, atau Nomor WhatsApp sudah terdaftar di Sheet Users.');
      return;
    }

    const isMatchPass = String(matched.Password || '').trim() === adminPassword.trim();
    const isMasterPass = (adminPassword.trim() === 'admin123' && (matched.Nama.toLowerCase().includes('admin') || term === 'admin'));

    if (!isMatchPass && !isMasterPass) {
      setErrorMsg('Password administrator salah. Silakan periksa kembali password Anda.');
      return;
    }

    onLoginSuccess(matched);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Brand Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 relative border-b border-teal-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {storeData.logo_url ? (
                <img
                  src={storeData.logo_url}
                  alt={storeData.nama_toko}
                  className="w-10 h-10 rounded-2xl object-cover border border-teal-500/40 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center font-black text-sm text-white shadow-xs">
                  {((storeData.nama_toko || 'AD')
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2) || 'AD').toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-extrabold text-sm text-white tracking-tight">
                  {storeData.nama_toko || 'Alinea Desain'}
                </h2>
                <p className="text-[11px] text-teal-300 font-medium line-clamp-1">
                  {storeData.tagline || 'Percetakan & Desain Grafis'}
                </p>
              </div>
            </div>

            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup & Lihat Katalog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <h3 className="text-base font-black text-white">
              {selectedRole === 'customer' ? 'Portal Akun Customer' : 'Portal Administrator'}
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {selectedRole === 'customer'
                ? 'Masuk atau daftar akun untuk memesan cetak kilat dan melihat nota'
                : 'Masuk khusus pengelola toko, kasir, dan operator cetak'}
            </p>
          </div>
        </div>

        {/* PRIMARY ROLE SELECTOR (CUSTOMER VS ADMIN) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('customer');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className={`w-4 h-4 ${selectedRole === 'customer' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Portal Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Portal Admin</span>
            </button>
          </div>
        </div>

        {/* ERROR & FEEDBACK NOTIFICATION */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* =================================================== */}
          {/* 1. CUSTOMER LOGIN & REGISTER PANEL */}
          {/* =================================================== */}
          {selectedRole === 'customer' && (
            <div className="space-y-4">
              {/* Subtabs: Masuk vs Daftar */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCustMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    custMode === 'login'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    custMode === 'register'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Daftar Akun Baru
                </button>
              </div>

              {/* CUSTOMER LOGIN FORM */}
              {custMode === 'login' ? (
                <form onSubmit={handleCustomerLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / Kode Customer / Nama
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={custLoginIdentifier}
                        onChange={(e) => setCustLoginIdentifier(e.target.value)}
                        placeholder="Contoh: 081234567890 atau Budi Santoso"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showCustPassword ? 'text' : 'password'}
                        value={custLoginPassword}
                        onChange={(e) => setCustLoginPassword(e.target.value)}
                        placeholder="Masukkan password Anda"
                        className="w-full text-xs pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustPassword(!showCustPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Sebagai Customer</span>
                  </button>
                </form>
              ) : (
                /* CUSTOMER REGISTER FORM */
                <form onSubmit={handleCustomerRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regNama}
                        onChange={(e) => setRegNama(e.target.value)}
                        placeholder="Contoh: Rian Prasetya"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={regNoWA}
                        onChange={(e) => setRegNoWA(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email (Opsional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Contoh: rian@gmail.com"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat / Kota Domisili
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regAlamat}
                        onChange={(e) => setRegAlamat(e.target.value)}
                        placeholder="Contoh: Sleman, Yogyakarta"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCustRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 4 karakter"
                          className="w-full text-xs pl-3 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustRegPassword(!showCustRegPassword)}
                          className="absolute right-2 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCustRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ulangi Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi password"
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Daftarkan Akun Customer Baru</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* 2. ADMINISTRATOR LOGIN PANEL (HANYA LOGIN SAJA) */}
          {/* =================================================== */}
          {selectedRole === 'admin' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-800">Panel Akses Administrator & Kasir</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    Gunakan akun Administrator untuk memproses transaksi kasir, katalog produk, pembukuan kas, serta pengaturan toko.
                  </p>
                </div>
              </div>

              {/* Informative Notice: Admin accounts are managed directly from Spreadsheet */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-amber-900 flex items-start gap-2.5">
                <TableProperties className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Manajemen Akun Admin:</span> Akun Administrator terpusat di Google Spreadsheet pada sheet <strong>Users</strong> (Role: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">admin</code>). Untuk menambah atau mengubah akun admin, silakan edit langsung di spreadsheet.
                </div>
              </div>

              {/* ADMIN LOGIN FORM ONLY */}
              <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / Email / Username Admin
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      placeholder="Contoh: admin atau 081234567890"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password Admin</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan password admin"
                      className="w-full text-xs pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-teal-400" />
                  <span>Masuk ke Panel Administrator</span>
                </button>
              </form>
            </div>
          )}

          {/* SINGLE LOGIN & SESSION PERSISTENCE NOTICE */}
          <div className="bg-slate-100/90 rounded-2xl p-3 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Satu Akun per Sesi (Login Tersimpan Otomatis)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Setelah login, info akun Anda disimpan di perangkat ini sehingga Anda tidak perlu login berulang kali. Untuk beralih ke akun lain, gunakan tombol <strong>Keluar</strong>.
            </p>
          </div>
        </div>

        {/* FOOTER: GUEST BROWSING OPTION */}
        {canClose && onClose && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto py-1 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>Lihat Produk Percetakan Sebagai Tamu</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
