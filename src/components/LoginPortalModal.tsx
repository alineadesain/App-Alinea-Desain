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
  Sparkles,
  LogIn,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  ShoppingBag
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
  
  // Customer mode: 'login' or 'register'
  const [custMode, setCustMode] = useState<'login' | 'register'>('login');
  
  // Password visibility toggles
  const [showCustPassword, setShowCustPassword] = useState(false);
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

  if (!isOpen) return null;

  const handleQuickAdminLogin = (adminUser: UserType) => {
    onLoginSuccess(adminUser);
    if (onClose) onClose();
  };

  // Handle Customer Manual Login
  const handleCustomerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const term = custLoginIdentifier.trim().toLowerCase();
    if (!term) {
      setErrorMsg('Masukkan No. WhatsApp, Kode Customer, atau Email!');
      return;
    }

    const matched = existingUsers.find((u) => {
      const matchWa = u.NoWA.replace(/\D/g, '') === term.replace(/\D/g, '');
      const matchCode = u.KodeKhusus.toLowerCase() === term;
      const matchEmail = u.Email?.toLowerCase() === term;
      const matchName = u.Nama.toLowerCase() === term;
      return matchWa || matchCode || matchEmail || matchName;
    });

    if (!matched) {
      setErrorMsg('Akun customer tidak ditemukan. Silakan periksa data atau daftar baru.');
      return;
    }

    if (matched.Role !== 'customer') {
      setErrorMsg('Akun ini adalah akun Administrator. Silakan pilih tab "Login Admin" di atas.');
      return;
    }

    if (matched.Password !== custLoginPassword) {
      setErrorMsg('Password customer salah. Silakan coba lagi.');
      return;
    }

    onLoginSuccess(matched);
    if (onClose) onClose();
  };

  // Handle Customer Manual Register
  const handleCustomerRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regNama.trim()) {
      setErrorMsg('Nama lengkap harus diisi!');
      return;
    }
    if (!regNoWA.trim()) {
      setErrorMsg('No. WhatsApp harus diisi!');
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

    const phoneExists = existingUsers.some(
      (u) => u.NoWA.replace(/\D/g, '') === regNoWA.trim().replace(/\D/g, '')
    );
    if (phoneExists) {
      setErrorMsg('Nomor WhatsApp ini sudah terdaftar. Silakan langsung masuk di tab Masuk Akun.');
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

  // Handle Admin Login Submit
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const term = adminIdentifier.trim().toLowerCase();
    if (!term) {
      setErrorMsg('Masukkan No. WA, Email, atau Username Admin!');
      return;
    }

    const matched = existingUsers.find((u) => {
      const matchWa = u.NoWA.replace(/\D/g, '') === term.replace(/\D/g, '');
      const matchEmail = u.Email?.toLowerCase() === term;
      const matchName = u.Nama.toLowerCase() === term;
      return matchWa || matchEmail || matchName;
    });

    if (!matched) {
      setErrorMsg('Akun Administrator tidak ditemukan. Periksa kembali kredensial Anda.');
      return;
    }

    if (matched.Role !== 'admin') {
      setErrorMsg('Akses ditolak: Akun ini bukan akun Administrator. Silakan login pada tab "Login Customer".');
      return;
    }

    if (matched.Password !== adminPassword) {
      setErrorMsg('Password admin salah. Silakan coba lagi.');
      return;
    }

    onLoginSuccess(matched);
    if (onClose) onClose();
  };

  // Sample admin accounts for quick testing
  const demoAdmins = existingUsers.filter((u) => u.Role === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
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
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
                title="Tutup & Lihat Katalog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <h3 className="text-base font-black text-white">
              {selectedRole === 'customer' ? 'Portal Masuk Customer' : 'Portal Masuk Administrator'}
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {selectedRole === 'customer'
                ? 'Pesan cetak kilat, cek nota, dan pantau status pengerjaan'
                : 'Akses dashboard transaksi kasir, slider, dan pembukuan toko'}
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
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                selectedRole === 'customer'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className={`w-4 h-4 ${selectedRole === 'customer' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Login Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                selectedRole === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Login Admin</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
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
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
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
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
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
                      No. WhatsApp / Kode Customer / Email
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={custLoginIdentifier}
                        onChange={(e) => setCustLoginIdentifier(e.target.value)}
                        placeholder="Contoh: 089876543210 atau budi12"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <span className="text-[10px] text-slate-400">Demo: budi12</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showCustPassword ? 'text' : 'password'}
                        required
                        value={custLoginPassword}
                        onChange={(e) => setCustLoginPassword(e.target.value)}
                        placeholder="Masukkan password Anda"
                        className="w-full text-xs pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustPassword(!showCustPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-teal-700/20 flex items-center justify-center gap-2"
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
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={regNama}
                        onChange={(e) => setRegNama(e.target.value)}
                        placeholder="Contoh: Rian Prasetya"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={regNoWA}
                        onChange={(e) => setRegNoWA(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email (Opsional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
                      Alamat Pengiriman / Domisili
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={regAlamat}
                        onChange={(e) => setRegAlamat(e.target.value)}
                        placeholder="Contoh: Jl. Kaliurang Km 5, Sleman"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 4 karakter"
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ulangi Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi password"
                        className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-teal-700/20 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Daftarkan Akun Customer Baru</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* 2. ADMINISTRATOR & KASIR LOGIN PANEL */}
          {/* =================================================== */}
          {selectedRole === 'admin' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">Akses Khusus Tim Percetakan & Kasir</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                    Hanya akun dengan hak akses <strong>Administrator</strong> yang dapat masuk ke panel ini untuk memproses pesanan, pengeluaran, serta data toko.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / Email / Username Admin
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      placeholder="Contoh: 081234567890 atau Admin Alinea"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password Admin</label>
                    <span className="text-[10px] text-slate-400">Demo: admin</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan password admin"
                      className="w-full text-xs pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-teal-400" />
                  <span>Masuk ke Panel Administrator</span>
                </button>
              </form>

              {/* Demo Admin Shortcuts */}
              {demoAdmins.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Pilih Akun Demo Admin Siap Pakai:
                  </p>
                  <div className="space-y-1.5">
                    {demoAdmins.map((admin) => (
                      <button
                        key={admin.ID}
                        type="button"
                        onClick={() => handleQuickAdminLogin(admin)}
                        className="w-full bg-white hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-left flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                            ADM
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                              {admin.Nama}
                            </p>
                            <p className="text-[10px] text-slate-400">{admin.NoWA} • pass: {admin.Password}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Masuk Langsung
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SINGLE LOGIN & SESSION PERSISTENCE NOTICE */}
          <div className="bg-slate-100/90 rounded-2xl p-3 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Satu Akun per Sesi (Login Tersimpan Otomatis)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Setelah login, info akun Anda disimpan di perangkat ini sehingga Anda tidak perlu login berulang kali. Untuk beralih ke akun lain, Anda harus menekan tombol <strong>Keluar Akun</strong> terlebih dahulu.
            </p>
          </div>
        </div>

        {/* FOOTER: GUEST BROWSING OPTION */}
        {canClose && onClose && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto py-1"
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
